let scene, camera, renderer;
let imageLayers = [];
let selectedLayer = null;
let layerCounter = 0;
let backgroundAudio = null;
let audioTracks = [];
let clock;

let sequentialPlayback = {
    isPlaying: false,
    currentIndex: 0,
    tracks: []
};

let backgroundMusic = {
    trackId: null,
    isPlaying: false,
    originalVolume: 0.8,
    fadeVolume: 0.3
};

// Initialize Three.js scene
function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 4, 0);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    clock = new THREE.Clock();

    // Add lights
    const ambientLight = new THREE.AmbientLight("#404040", 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight("#ffffff", 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(20, 20, "#444444", "#444444");
    scene.add(gridHelper);

    // Add axes helper
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    const planeGeometry = new THREE.PlaneGeometry(4, 4);
    const planeMaterial = new THREE.MeshBasicMaterial({
        color: "#444444",
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    });

    const referencePlane = new THREE.Mesh(planeGeometry, planeMaterial);
    referencePlane.rotation.x = -Math.PI / 2;
    referencePlane.position.y = 0;
    scene.add(referencePlane);

    const phoneGeometry = new THREE.BoxGeometry(0.1, 1, 2);
    const phoneMaterial = new THREE.MeshBasicMaterial({ color: "#2c3e50" });
    const phoneIcon = new THREE.Mesh(phoneGeometry, phoneMaterial);
    phoneIcon.position.set(0, 4, 0);
    phoneIcon.rotation.z = Math.PI / 2;
    scene.add(phoneIcon);

    addMouseControls();
    animate();
}

// Update background color
function updateBackgroundColor() {
    const color = document.getElementById('bgColor').value;
    scene.background = new THREE.Color(color);
}

// Add image layer
function addImageLayer() {
    const fileInput = document.getElementById('imageFile');
    const files = fileInput.files;

    if (files.length === 0) {
        alert('Please select image files first');
        return;
    }

    Array.from(files).forEach(file => {
        const img = new Image();
        img.onload = function () {
            const texture = new THREE.Texture(img);
            texture.needsUpdate = true;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;

            const aspect = img.width / img.height;
            const geometry = new THREE.PlaneGeometry(2 * aspect, 2);
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                side: THREE.DoubleSide,
                alphaTest: 0.1
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(0, 0, 0);

            const layer = {
                id: layerCounter++,
                name: file.name,
                mesh: mesh,
                texture: texture,
                originalPosition: { x: 0, y: 0, z: 0 },
                originalRotation: { x: 0, y: 0, z: 0 },
                originalScale: { x: 1, y: 1, z: 1 },
                originalOpacity: 1,
                animation: null,
                enableCustomAnimation: false,
                specialEffect: 'none',
                animationSpeed: 1,
                animationDuration: 2,
                loopAnimation: false,
                customAnimation: {
                    start: { x: 0, y: 0, z: 0, scale: 1, opacity: 1, rotation: 0 },
                    end: { x: 0, y: 0, z: 0, scale: 1, opacity: 1, rotation: 0 }
                },
                specialEffectSettings: {
                    swingRange: 90,
                    swingFreq: 8,
                    swingTargetX: 5,
                    zigzagAmp: 2,
                    zigzagFreq: 6,
                    zigzagTargetX: 5,
                    zigzagTargetY: 3,
                    pendulumRange: 60,
                    pendulumSpeed: 2,
                    waveAmp: 1.5,
                    waveFreq: 4,
                    waveTargetX: 4,
                    waveTargetY: 2,
                    bounceHeight: 2,
                    bounceFreq: 4,
                    spiralRadius: 3,
                    spiralRotations: 6,
                    slideDistance: 10,
                    rotateCycles: 1
                }
            };

            imageLayers.push(layer);
            scene.add(mesh);

            updateLayersList();
            selectLayer(layer);
        };
        img.src = URL.createObjectURL(file);
    });

    fileInput.value = '';
}

// Update layers list
function updateLayersList() {
    const layersDiv = document.getElementById('layers');
    layersDiv.innerHTML = '';

    imageLayers.forEach(layer => {
        const layerDiv = document.createElement('div');
        layerDiv.className = 'layer-item';
        layerDiv.innerHTML = `
                    <span>${layer.id}: ${layer.name}</span>
                    <button class="delete-btn" onclick="deleteLayer(${layer.id})">×</button>
                `;
        layerDiv.onclick = (e) => {
            if (e.target.classList.contains('delete-btn')) return;
            selectLayer(layer);
        };
        layersDiv.appendChild(layerDiv);
    });
}

// Delete layer
function deleteLayer(layerId) {
    const layerIndex = imageLayers.findIndex(layer => layer.id === layerId);
    if (layerIndex === -1) return;

    const layer = imageLayers[layerIndex];
    scene.remove(layer.mesh);
    imageLayers.splice(layerIndex, 1);

    if (selectedLayer && selectedLayer.id === layerId) {
        selectedLayer = null;
    }

    updateLayersList();
}

// Select layer
function selectLayer(layer) {
    selectedLayer = layer;

    document.querySelectorAll('.layer-item').forEach(item => {
        item.classList.remove('selected');
    });

    const layerItems = document.querySelectorAll('.layer-item');
    if (layerItems[imageLayers.indexOf(layer)]) {
        layerItems[imageLayers.indexOf(layer)].classList.add('selected');
    }

    // Update controls to match selected layer
    const pos = layer.mesh.position;
    const rot = layer.mesh.rotation;
    const scale = layer.mesh.scale.x;
    const alpha = layer.mesh.material.opacity;

    document.getElementById('xPos').value = pos.x;
    document.getElementById('yPos').value = pos.y;
    document.getElementById('zPos').value = pos.z;
    document.getElementById('rotX').value = rot.x * 180 / Math.PI;
    document.getElementById('rotY').value = rot.y * 180 / Math.PI;
    document.getElementById('rotZ').value = rot.z * 180 / Math.PI;
    document.getElementById('scale').value = scale;
    document.getElementById('alpha').value = alpha;
    document.getElementById('enableCustomAnimation').checked = layer.enableCustomAnimation;
    document.getElementById('specialEffect').value = layer.specialEffect;
    document.getElementById('animationSpeed').value = layer.animationSpeed;
    document.getElementById('animationDuration').value = layer.animationDuration;
    document.getElementById('loopAnimation').checked = layer.loopAnimation;

    // Update custom animation controls
    const custom = layer.customAnimation;
    document.getElementById('startX').value = custom.start.x;
    document.getElementById('startY').value = custom.start.y;
    document.getElementById('startZ').value = custom.start.z;
    document.getElementById('startScale').value = custom.start.scale;
    document.getElementById('startOpacity').value = custom.start.opacity;
    document.getElementById('startRotation').value = custom.start.rotation;

    document.getElementById('endX').value = custom.end.x;
    document.getElementById('endY').value = custom.end.y;
    document.getElementById('endZ').value = custom.end.z;
    document.getElementById('endScale').value = custom.end.scale;
    document.getElementById('endOpacity').value = custom.end.opacity;
    document.getElementById('endRotation').value = custom.end.rotation;

    // Update special effect settings
    const settings = layer.specialEffectSettings;
    document.getElementById('swingRange').value = settings.swingRange;
    document.getElementById('swingFreq').value = settings.swingFreq;
    document.getElementById('swingTargetX').value = settings.swingTargetX;
    document.getElementById('zigzagAmp').value = settings.zigzagAmp;
    document.getElementById('zigzagFreq').value = settings.zigzagFreq;
    document.getElementById('zigzagTargetX').value = settings.zigzagTargetX;
    document.getElementById('zigzagTargetY').value = settings.zigzagTargetY;
    document.getElementById('pendulumRange').value = settings.pendulumRange;
    document.getElementById('pendulumSpeed').value = settings.pendulumSpeed;
    document.getElementById('waveAmp').value = settings.waveAmp;
    document.getElementById('waveFreq').value = settings.waveFreq;
    document.getElementById('waveTargetX').value = settings.waveTargetX;
    document.getElementById('waveTargetY').value = settings.waveTargetY;
    document.getElementById('bounceHeight').value = settings.bounceHeight;
    document.getElementById('bounceFreq').value = settings.bounceFreq;
    document.getElementById('spiralRadius').value = settings.spiralRadius;
    document.getElementById('spiralRotations').value = settings.spiralRotations;
    document.getElementById('slideDistance').value = settings.slideDistance;
    document.getElementById('rotateCycles').value = settings.rotateCycles;

    toggleCustomControls();
    updateSpecialEffect();
    updateControlValues();
}

// Toggle custom controls visibility
function toggleCustomControls() {
    const customControls = document.getElementById('customAnimationControls');
    const enableCustom = document.getElementById('enableCustomAnimation').checked;
    customControls.style.display = enableCustom ? 'block' : 'none';

    if (selectedLayer) {
        selectedLayer.enableCustomAnimation = enableCustom;
    }
}

// Update animation speed
function updateAnimationSpeed() {
    if (!selectedLayer) return;
    selectedLayer.animationSpeed = parseFloat(document.getElementById('animationSpeed').value);
    updateControlValues();
}

// Update animation duration
function updateAnimationDuration() {
    if (!selectedLayer) return;
    selectedLayer.animationDuration = parseFloat(document.getElementById('animationDuration').value);
    updateControlValues();
}

// Save current layer settings (including loop)
function saveCurrentLayerSettings() {
    if (!selectedLayer) return;

    selectedLayer.loopAnimation = document.getElementById('loopAnimation').checked;
    selectedLayer.enableCustomAnimation = document.getElementById('enableCustomAnimation').checked;
    selectedLayer.specialEffect = document.getElementById('specialEffect').value;
    selectedLayer.animationSpeed = parseFloat(document.getElementById('animationSpeed').value);
    selectedLayer.animationDuration = parseFloat(document.getElementById('animationDuration').value);
}

// Create animation for a specific layer
function createAnimationForLayer(layer) {
    if (!layer.enableCustomAnimation && layer.specialEffect === 'none') {
        return null;
    }

    const mesh = layer.mesh;
    const duration = layer.animationDuration;
    const speed = layer.animationSpeed;
    const loop = layer.loopAnimation;
    const settings = layer.specialEffectSettings;

    const startTime = Date.now();
    return {
        stop: () => { layer.animation = null; },
        update: (currentTime) => {
            const elapsed = (currentTime - startTime) / 1000 * speed;
            let progress = (elapsed % duration) / duration;

            if (!loop && elapsed > duration) {
                progress = 1;
            }

            const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            const easedProgress = easeInOut(progress);

            // Start with original position/properties
            let finalX = layer.originalPosition.x;
            let finalY = layer.originalPosition.y;
            let finalZ = layer.originalPosition.z;
            let finalRotX = layer.originalRotation.x;
            let finalRotY = layer.originalRotation.y;
            let finalRotZ = layer.originalRotation.z;
            let finalScaleX = layer.originalScale.x;
            let finalScaleY = layer.originalScale.y;
            let finalScaleZ = layer.originalScale.z;
            let finalOpacity = layer.originalOpacity;

            // Apply custom animation if enabled
            if (layer.enableCustomAnimation) {
                const start = layer.customAnimation.start;
                const end = layer.customAnimation.end;

                // Interpolate custom position
                finalX = start.x + (end.x - start.x) * easedProgress;
                finalY = start.y + (end.y - start.y) * easedProgress;
                finalZ = start.z + (end.z - start.z) * easedProgress;

                // Interpolate custom scale
                const customScale = start.scale + (end.scale - start.scale) * easedProgress;
                finalScaleX = finalScaleY = finalScaleZ = customScale;

                // Interpolate custom opacity
                finalOpacity = start.opacity + (end.opacity - start.opacity) * easedProgress;

                // Interpolate custom rotation
                finalRotZ = (start.rotation + (end.rotation - start.rotation) * easedProgress) * Math.PI / 180;
            }

            // Apply special effects on top of custom animation with user-controlled settings
            if (layer.specialEffect !== 'none') {
                switch (layer.specialEffect) {
                    case 'swingToTarget':
                        const swingAmplitude = (1 - easedProgress) * settings.swingRange;
                        const swingAngle = Math.sin(progress * settings.swingFreq * Math.PI) * swingAmplitude;
                        finalRotZ += (swingAngle * Math.PI / 180);

                        if (!layer.enableCustomAnimation) {
                            finalX += settings.swingTargetX * easedProgress;
                        }
                        break;

                    case 'zigzagToTarget':
                        const zigzagAmplitude = (1 - easedProgress) * settings.zigzagAmp;
                        const zigzagOffset = Math.sin(progress * settings.zigzagFreq * Math.PI) * zigzagAmplitude;
                        finalX += zigzagOffset;

                        if (!layer.enableCustomAnimation) {
                            finalX += settings.zigzagTargetX * easedProgress;
                            finalY += settings.zigzagTargetY * easedProgress;
                        }
                        break;

                    case 'pendulumMove':
                        const pendulumAngle = Math.sin(elapsed * settings.pendulumSpeed) * settings.pendulumRange;
                        finalRotZ += (pendulumAngle * Math.PI / 180);
                        break;

                    case 'waveToTarget':
                        const waveY = Math.sin(progress * settings.waveFreq * Math.PI) * settings.waveAmp * (1 - easedProgress);
                        finalY += waveY;
                        finalRotZ += (waveY * 0.2);

                        if (!layer.enableCustomAnimation) {
                            finalX += settings.waveTargetX * easedProgress;
                            finalY += settings.waveTargetY * easedProgress;
                        }
                        break;

                    case 'elasticMove':
                        const scaleElastic = 1 + Math.sin(progress * 10) * 0.1 * (1 - progress);
                        finalScaleX *= scaleElastic;
                        finalScaleY *= scaleElastic;
                        finalScaleZ *= scaleElastic;

                        if (!layer.enableCustomAnimation) {
                            const elasticEase = (t) => {
                                if (t === 0) return 0;
                                if (t === 1) return 1;
                                const c4 = (2 * Math.PI) / 3;
                                return t < 0.5
                                    ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c4)) / 2
                                    : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c4)) / 2 + 1;
                            };
                            const elasticProgress = elasticEase(progress);
                            finalX += 3 * elasticProgress;
                            finalY += 3 * elasticProgress;
                        }
                        break;

                    case 'slideDown':
                        finalY += settings.slideDistance * (1 - easedProgress);
                        break;
                    case 'slideUp':
                        finalY -= settings.slideDistance * (1 - easedProgress);
                        break;
                    case 'slideLeft':
                        finalX += settings.slideDistance * (1 - easedProgress);
                        break;
                    case 'slideRight':
                        finalX -= settings.slideDistance * (1 - easedProgress);
                        break;
                    case 'fadeIn':
                        finalOpacity *= easedProgress;
                        break;
                    case 'scaleIn':
                        const scaleInFactor = easedProgress;
                        finalScaleX *= scaleInFactor;
                        finalScaleY *= scaleInFactor;
                        finalScaleZ *= scaleInFactor;
                        break;
                    case 'rotate':
                        finalRotZ += easedProgress * Math.PI * 2 * settings.rotateCycles;
                        break;
                    case 'bounce':
                        const bounceY = Math.abs(Math.sin(easedProgress * Math.PI * settings.bounceFreq)) * settings.bounceHeight;
                        finalY += bounceY;
                        break;
                    case 'spiral':
                        const spiralRadius = settings.spiralRadius * (1 - easedProgress);
                        const spiralAngle = easedProgress * Math.PI * settings.spiralRotations;
                        finalX += spiralRadius * Math.cos(spiralAngle);
                        finalY += spiralRadius * Math.sin(spiralAngle);
                        break;
                }
            }

            // Apply final transformations
            mesh.position.set(finalX, finalY, finalZ);
            mesh.rotation.set(finalRotX, finalRotY, finalRotZ);
            mesh.scale.set(finalScaleX, finalScaleY, finalScaleZ);
            mesh.material.opacity = finalOpacity;
        }
    };
}

async function exportAsAR() {
    const name = (document.getElementById('projectName').value || 'AR_Project').trim();
    const zip = new JSZip();

    // Generate and add HTML content
    zip.file(name + '.html', generateHTMLContent());

    // Add image files
    const imageFiles = zip.folder('images');
    for (const layer of imageLayers) {
        if (layer.texture.image && layer.texture.image.src) {
            const img = layer.texture.image;
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imgBlob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png');
            });
            imageFiles.file(layer.name, imgBlob);
        }
    }

    // Add background audio (legacy support)
    if (backgroundAudio) {
        const audioFiles = zip.folder('audio');
        audioFiles.file(backgroundAudio.fileName, backgroundAudio.blob);
    }

    // Add audio tracks from the audio system
    if (typeof audioTracks !== 'undefined' && audioTracks.length > 0) {
        const audioFiles = zip.folder('audio');

        // Process each audio track
        for (const track of audioTracks) {
            try {
                // Get audio blob from the audio element
                const audioBlob = await getAudioBlobFromElement(track.audio);

                if (audioBlob) {
                    // Generate safe filename
                    const safeFileName = sanitizeFileName(track.name);
                    const fileName = `${safeFileName}.mp3`;

                    // Add audio file to zip
                    audioFiles.file(fileName, audioBlob);

                    console.log(`Added audio track: ${track.name} (${fileName})`);
                }
            } catch (error) {
                console.error(`Error processing audio track ${track.name}:`, error);
            }
        }

        console.log(`Added ${audioTracks.length} audio tracks to export`);
    }

    // Add QR code if URL is provided
    const url = document.getElementById('websiteUrl').value.trim();
    if (url) {
        try {
            const qr = qrcode(0, 'M');
            qr.addData(url);
            qr.make();

            // Create canvas for QR code
            const qrCanvas = document.createElement('canvas');
            const size = 512;
            qrCanvas.width = size;
            qrCanvas.height = size;

            const ctx = qrCanvas.getContext('2d');
            const moduleCount = qr.getModuleCount();
            const moduleSize = size / moduleCount;

            // Fill white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, size, size);

            // Draw black modules
            ctx.fillStyle = '#000000';
            for (let row = 0; row < moduleCount; row++) {
                for (let col = 0; col < moduleCount; col++) {
                    if (qr.isDark(row, col)) {
                        ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
                    }
                }
            }

            const qrBlob = await new Promise(resolve => {
                qrCanvas.toBlob(resolve, 'image/png');
            });

            zip.file(name + '-qr-code.png', qrBlob);
        } catch (error) {
            console.error('Error generating QR code for package:', error);
        }
    }

    // Generate and save the zip file
    try {
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, name + "_AR_Package.zip");
        console.log(`AR Package exported successfully: ${name}_AR_Package.zip`);
    } catch (error) {
        console.error('Error generating zip file:', error);
    }
}



function sanitizeFileName(fileName) {
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    return nameWithoutExt
        .replace(/[^a-zA-Z0-9_\-\s]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/_{2,}/g, '_') // Replace multiple underscores with single
        .trim();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const currentTime = Date.now();

    // Update animations
    imageLayers.forEach(layer => {
        if (layer.animation && layer.animation.update) {
            layer.animation.update(currentTime);
        }
    });

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize scene when page loads
window.addEventListener('load', initScene);