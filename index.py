import cv2
import torch
import os
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
import numpy as npsol
import open3d as o3d


# Directory containing images
image_dir = './dataset'
output_depth = './image'
output_ply = './ply'
os.makedirs(output_depth, exist_ok=True)
os.makedirs(output_ply, exist_ok=True)

# Load MiDaS model
model_type = "MiDaS_small"  # Fastest, for demo
midas = torch.hub.load("intel-isl/MiDaS", model_type)
midas.eval()
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
midas.to(device)

# Load transforms
midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms")
transform = midas_transforms.small_transform

# Process all images in the dataset directory
for filename in os.listdir(image_dir):
    if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.tiff')):
        image_path = os.path.join(image_dir, filename)
        img = cv2.imread(image_path)
        if img is None:
            print(f"Failed to load {image_path}")
            continue
        print(f"Processing {filename} with shape: {img.shape}")
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        input_tensor = transform(img_rgb).to(device)

        with torch.no_grad():
            prediction = midas(input_tensor).unsqueeze(1)
            if prediction.ndim == 3:
                prediction = prediction.unsqueeze(1)
            prediction = torch.nn.functional.interpolate(
                prediction,
                size=img_rgb.shape[:2],
                mode="bicubic",
                align_corners=False,
            ).squeeze()
        depth = prediction.cpu().numpy()
        plt.imshow(depth)

        # Normalize depth to 0-255 and saves
        depth_min = depth.min()
        depth_max = depth.max()
        depth_norm = (255 * (depth - depth_min) / (depth_max - depth_min)).astype(np.uint8)
        depth_filename = os.path.splitext(filename)[0] + '_depth_map.png'
        cv2.imwrite(os.path.join(output_depth, depth_filename), depth_norm)
        print(f'Depth map saved as {depth_filename}')

        # Create point cloud (2D to 3D)
        fx = fy = 500
        cx = img.shape[1] / 2
        cy = img.shape[0] / 2
        points = []
        for v in range(img.shape[0]):
            for u in range(img.shape[1]):
                z = depth_norm[v, u] / 255.0
                if z == 0:
                    continue
                x = (u - cx) * z / fx
                y = (v - cy) * z / fy
                color = img[v, u]
                points.append("%f %f %f %d %d %d\n" % (x, y, z, color[2], color[1], color[0]))
        ply_filename = os.path.splitext(filename)[0] + '_point_cloud.ply'
        with open(os.path.join(output_ply, ply_filename), 'w') as f:
            f.write('element vertex %d\n' % len(points))

            for p in points:
                f.write(p)
        print(f'Point cloud saved as {ply_filename}')

for filename in os.listdir(output_ply):
    if filename.lower().endswith('.ply'):
        ply_path = os.path.join(output_ply, filename)
        print(f"Showing: {ply_path}")
        pcd = o3d.io.read_point_cloud(ply_path)
        print(f"Point cloud loaded with {len(pcd.points)} points.")
        o3d.visualization.draw_geometries([pcd], width=1980, height=600, left=50, top=50, window_name=filename)

