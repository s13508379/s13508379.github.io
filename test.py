from __future__ import annotations

import os
import cv2 
import torch
import numpy as np
from tqdm import tqdm
import open3d as o3d


IMAGE_DIR = "./assets"
DEPTH_DIR = "./image"
PLY_DIR   = "./ply"
VIDEO_DIR = "./video"

FX = FY = 500               # Camera intrinsics (px)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_TYPE = "DPT_Large"  #  "MiDaS_small OR DPT_Large" 

for d in (DEPTH_DIR, PLY_DIR, VIDEO_DIR):
    os.makedirs(d, exist_ok=True)
 
def write_ply(path: str, vertex_lines: list[str]):

    with open(path, "w", encoding="utf‑8") as f:
        f.write(f"element vertex {len(vertex_lines)}\n")
        f.writelines(vertex_lines)


def saliency_center(img_bgr: np.ndarray) -> tuple[int, int]:
    sal = cv2.saliency.StaticSaliencySpectralResidual_create()
    ok, sal_map = sal.computeSaliency(img_bgr)
    if not ok:
        h, w, _ = img_bgr.shape
        return (w // 2, h // 2)
    # Threshold at 30 % of max and take center of mass
    thresh = (sal_map > sal_map.max() * 0.3).astype(np.uint8)
    if thresh.sum() == 0:  # fallback
        h, w, _ = img_bgr.shape
        return (w // 2, h // 2)
    M = cv2.moments(thresh)
    cx = int(M["m10"] / (M["m00"] + 1e-8))
    cy = int(M["m01"] / (M["m00"] + 1e-8))
    return (cx, cy)


def plan_motion(img_shape: tuple[int, int], target: tuple[int, int]) -> dict[str, float]:
    """Compute dx, dy, dz, yaw based on target centre (pixels)."""
    h, w = img_shape
    cx, cy = w / 2, h / 2
    tx, ty = target
    # Normalised offset (‑1 … 1)
    off_x = (cx - tx) / w
    off_y = (cy - ty) / h
    # Scale translation: larger offset ⇒ larger pan (cap at 5 cm equiv.)
    max_trans = 0.05  # world units
    dx = max_trans * off_x
    dy = max_trans * off_y
    dz = 0.05          # constant gentle zoom
    yaw = 1.5 * off_x  # small yaw following horizontal pan
    return {"dx": dx, "dy": dy, "dz": dz, "yaw_deg": yaw}


def ken_burns(img_bgr: np.ndarray,
              depth_norm: np.ndarray,
              motion: dict[str, float],
              n_frames: int = 48,
              fx: float = FX,
              fy: float = FY):
    h, w = depth_norm.shape
    cx, cy = w / 2, h / 2

    dx_final  = motion["dx"]
    dy_final  = motion["dy"]
    dz_final  = motion["dz"]
    yaw_final = np.deg2rad(motion["yaw_deg"]) if isinstance(motion["yaw_deg"], (int, float)) else 0.0

    us, vs = np.meshgrid(np.arange(w), np.arange(h))
    Z = depth_norm
    X = (us - cx) * Z / fx
    Y = (vs - cy) * Z / fy
    pts = np.stack([X, Y, Z, np.ones_like(Z)], -1)

    img_f = img_bgr.astype(np.float32) / 255.0
    frames = []
    for i in range(n_frames):
        t = 0.5 - 0.5 * np.cos(np.pi * i / (n_frames - 1))  # smooth S‑curve
        dx = dx_final * t
        dy = dy_final * t
        dz = 1 + dz_final * t
        yaw = yaw_final * t
        R = np.array([[ np.cos(yaw), 0,  np.sin(yaw), dx ],
                      [ 0,           1,  0,           dy ],
                      [-np.sin(yaw), 0,  np.cos(yaw), 0  ],
                      [ 0,           0,  0,           1  ]], dtype=np.float32)
        P = pts @ R.T
        x_proj = (P[..., 0] / (P[..., 2] * dz)) * fx + cx
        y_proj = (P[..., 1] / (P[..., 2] * dz)) * fy + cy

        map_x = x_proj.astype(np.float32)
        map_y = y_proj.astype(np.float32)
        frame = cv2.remap(img_f, map_x, map_y, interpolation=cv2.INTER_LINEAR,
                          borderMode=cv2.BORDER_CONSTANT, borderValue=0)
        mask = (frame.sum(-1) == 0).astype(np.uint8)
        if mask.any():
            frame = cv2.inpaint((frame * 255).astype(np.uint8), mask, 3, cv2.INPAINT_NS).astype(np.float32) / 255.0
        frames.append((frame * 255).astype(np.uint8))
    return frames

# ──────────────────────────────────────────────────────────────────────────────
# Load MiDaS
# ──────────────────────────────────────────────────────────────────────────────
print("Loading MiDaS model … (first call downloads weights)")
midas = torch.hub.load("intel-isl/MiDaS", MODEL_TYPE, trust_repo=True).to(DEVICE)
midas.eval()
print("MiDaS ready ✓")

midas_tf = torch.hub.load("intel-isl/MiDaS", "transforms", trust_repo=True)
transform = midas_tf.small_transform

for fname in os.listdir(IMAGE_DIR):
    if not fname.lower().endswith((".png", ".jpg", ".jpeg", ".bmp", ".tiff")):
        continue
    stem, _ = os.path.splitext(fname)
    path = os.path.join(IMAGE_DIR, fname)

    img = cv2.imread(path)
    if img is None:
        print(f"[WARN] Cannot read {path}")
        continue
    print(f"▶ {fname}")

    with torch.no_grad():
        inp = transform(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)).to(DEVICE)
        pred = midas(inp)
        pred = torch.nn.functional.interpolate(pred.unsqueeze(1), size=img.shape[:2], mode="bicubic", align_corners=False).squeeze()
    depth = pred.cpu().numpy()
    depth_norm = (depth - depth.min()) / (np.ptp(depth) + 1e-8)

    cv2.imwrite(os.path.join(DEPTH_DIR, f"{stem}_depth.png"), (depth_norm * 255).astype(np.uint8))

    # ─ Point cloud ─
    h, w = depth_norm.shape
    cx, cy = w / 2, h / 2
    verts = []
    for v in range(h):
        for u in range(w):
            z = depth_norm[v, u]
            if z == 0: continue
            x = (u - cx) * z / FX
            y = (v - cy) * z / FY
            b, g, r = img[v, u]
            verts.append(f"{x} {y} {z} {r} {g} {b}\n")
    ply_path = os.path.join(PLY_DIR, f"{stem}.ply")
    write_ply(ply_path, verts)

    # ─ Auto motion plan ─
    target = saliency_center(img)
    motion = plan_motion(img.shape[:2], target)

    # ─ Ken‑Burns video ─
    frames = ken_burns(img, depth_norm, motion)
    video_path = os.path.join(VIDEO_DIR, f"{stem}_kenburns.mp4")
    vw = cv2.VideoWriter(video_path, cv2.VideoWriter_fourcc(*"mp4v"), 24, (w, h))
    for f in frames:
        vw.write(f)
    vw.release()

    print(f"  ✓ Depth  → {stem}_depth.png")
    print(f"  ✓ Cloud  → {stem}.ply")
    print(f"  ✓ Video  → {stem}_kenburns.mp4\n")

# ─ Optional: interactive cloud viewer (press Q to close) ─
for ply in os.listdir(PLY_DIR):
    if ply.endswith(".ply"):
        cloud = o3d.io.read_point_cloud(os.path.join(PLY_DIR, ply))
        o3d.visualization.draw_geometries([cloud], width=1600, height=900,
                                          window_name=ply)
