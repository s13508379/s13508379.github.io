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
    document.getElementById('rotX').value = rot.x / Math.PI * 180;
    document.getElementById('rotY').value = rot.y / Math.PI * 180;
    document.getElementById('rotZ').value = rot.z / Math.PI * 180;
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
}

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