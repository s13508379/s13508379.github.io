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



// Update background color
function updateBackgroundColor() {
    const color = document.getElementById('bgColor').value;
    scene.background = new THREE.Color(color);
}

// Toggle custom controls visibility and animation mode
function toggleCustomControls() {
    const customControls = document.getElementById('customAnimationControls');
    const enableCustom = document.getElementById('enableCustomAnimation').checked;
    customControls.style.display = enableCustom ? 'block' : 'none';

    // Show/hide animation mode indicators
    const indicators = [
        'positionModeIndicator',
        'materialModeIndicator',
        'rotationModeIndicator'
    ];

    indicators.forEach(indicatorId => {
        const indicator = document.getElementById(indicatorId);
        if (indicator) {
            indicator.style.display = enableCustom ? 'block' : 'none';
        }
    });

    if (selectedLayer) {
        selectedLayer.enableCustomAnimation = enableCustom;

        if (enableCustom) {
            // Initialize separated controls with current main control values when animation is first enabled
            if (!selectedLayer.separatedControls) {
                selectedLayer.separatedControls = {
                    position: {
                        x: parseFloat(document.getElementById('xPos').value) || 0,
                        y: parseFloat(document.getElementById('yPos').value) || 0,
                        z: parseFloat(document.getElementById('zPos').value) || 0
                    },
                    rotation: {
                        x: parseFloat(document.getElementById('rotX').value) || 0,
                        y: parseFloat(document.getElementById('rotY').value) || 0,
                        z: parseFloat(document.getElementById('rotZ').value) || 0
                    },
                    scale: parseFloat(document.getElementById('scale').value) || 1,
                    opacity: parseFloat(document.getElementById('alpha').value) || 1
                };
            }
            console.log('Animation mode enabled: Main controls are now separated from layer properties');
        } else {
            // When animation is disabled, sync main controls back to current layer state
            syncMainControlsWithCurrentLayer();
        }
    }
}

// Sync main controls with current layer state (when animation is disabled)
function syncMainControlsWithCurrentLayer() {
    if (!selectedLayer) return;

    const pos = selectedLayer.mesh.position;
    const rot = selectedLayer.mesh.rotation;
    const scale = selectedLayer.mesh.scale.x;
    const alpha = selectedLayer.mesh.material.opacity;

    document.getElementById('xPos').value = pos.x;
    document.getElementById('yPos').value = pos.y;
    document.getElementById('zPos').value = pos.z;
    document.getElementById('scale').value = scale;
    document.getElementById('alpha').value = alpha;
    document.getElementById('rotX').value = rot.x * 180 / Math.PI;
    document.getElementById('rotY').value = rot.y * 180 / Math.PI;
    document.getElementById('rotZ').value = rot.z * 180 / Math.PI;
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
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imgBlob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png');
            });
            imageFiles.file(layer.name, imgBlob);
        }
    }

    // ADD JSON MODEL DATA TO ZIP
    try {
        // Generate model data (reuse logic from exportAsModel)
        const projectName = document.getElementById('projectName').value;
        const bgColor = document.getElementById('bgColor').value;
        const websiteUrl = document.getElementById('websiteUrl').value;

        // Prepare layers data with preserved input values
        const layersData = [];
        for (const layer of imageLayers) {
            // Convert texture to base64
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = layer.texture.image;
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const imageData = canvas.toDataURL('image/png');

            const layerData = {
                id: layer.id,
                name: layer.name,
                imageData: imageData,
                imageDetails: {
                    width: img.width,
                    height: img.height,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight
                },
                position: getCleanTransform(layer.inputPosition, layer.mesh.position),
                rotation: getCleanRotation(layer.inputRotation, layer.mesh.rotation),
                scale: getCleanTransform(layer.inputScale, layer.mesh.scale),
                opacity: getCleanValue(layer.inputOpacity, layer.mesh.material.opacity),
                originalPosition: getCleanTransform(layer.originalInputPosition, layer.originalPosition),
                originalRotation: getCleanRotation(layer.originalInputRotation, layer.originalRotation),
                originalScale: getCleanTransform(layer.originalInputScale, layer.originalScale),
                originalOpacity: getCleanValue(layer.originalInputOpacity, layer.originalOpacity),
                inputPosition: layer.inputPosition,
                inputRotation: layer.inputRotation,
                inputScale: layer.inputScale,
                inputOpacity: layer.inputOpacity,
                originalInputPosition: layer.originalInputPosition,
                originalInputRotation: layer.originalInputRotation,
                originalInputScale: layer.originalInputScale,
                originalInputOpacity: layer.originalInputOpacity,
                enableCustomAnimation: layer.enableCustomAnimation,
                specialEffect: layer.specialEffect,
                animationSpeed: getCleanValue(layer.inputAnimationSpeed, layer.animationSpeed),
                animationDuration: getCleanValue(layer.inputAnimationDuration, layer.animationDuration),
                loopAnimation: layer.loopAnimation,
                customAnimation: {
                    start: {
                        x: getCleanValue(layer.customAnimation.start.inputX, layer.customAnimation.start.x),
                        y: getCleanValue(layer.customAnimation.start.inputY, layer.customAnimation.start.y),
                        z: getCleanValue(layer.customAnimation.start.inputZ, layer.customAnimation.start.z),
                        scale: getCleanValue(layer.customAnimation.start.inputScale, layer.customAnimation.start.scale),
                        opacity: getCleanValue(layer.customAnimation.start.inputOpacity, layer.customAnimation.start.opacity),
                        rotationX: getCleanValue(layer.customAnimation.start.inputRotationX, layer.customAnimation.start.rotationX),
                        rotationY: getCleanValue(layer.customAnimation.start.inputRotationY, layer.customAnimation.start.rotationY),
                        rotationZ: getCleanValue(layer.customAnimation.start.inputRotationZ, layer.customAnimation.start.rotationZ),
                        inputX: layer.customAnimation.start.inputX,
                        inputY: layer.customAnimation.start.inputY,
                        inputZ: layer.customAnimation.start.inputZ,
                        inputScale: layer.customAnimation.start.inputScale,
                        inputOpacity: layer.customAnimation.start.inputOpacity,
                        inputRotationX: layer.customAnimation.start.inputRotationX,
                        inputRotationY: layer.customAnimation.start.inputRotationY,
                        inputRotationZ: layer.customAnimation.start.inputRotationZ
                    },
                    end: {
                        x: getCleanValue(layer.customAnimation.end.inputX, layer.customAnimation.end.x),
                        y: getCleanValue(layer.customAnimation.end.inputY, layer.customAnimation.end.y),
                        z: getCleanValue(layer.customAnimation.end.inputZ, layer.customAnimation.end.z),
                        scale: getCleanValue(layer.customAnimation.end.inputScale, layer.customAnimation.end.scale),
                        opacity: getCleanValue(layer.customAnimation.end.inputOpacity, layer.customAnimation.end.opacity),
                        rotationX: getCleanValue(layer.customAnimation.end.inputRotationX, layer.customAnimation.end.rotationX),
                        rotationY: getCleanValue(layer.customAnimation.end.inputRotationY, layer.customAnimation.end.rotationY),
                        rotationZ: getCleanValue(layer.customAnimation.end.inputRotationZ, layer.customAnimation.end.rotationZ),
                        inputX: layer.customAnimation.end.inputX,
                        inputY: layer.customAnimation.end.inputY,
                        inputZ: layer.customAnimation.end.inputZ,
                        inputScale: layer.customAnimation.end.inputScale,
                        inputOpacity: layer.customAnimation.end.inputOpacity,
                        inputRotationX: layer.customAnimation.end.inputRotationX,
                        inputRotationY: layer.customAnimation.end.inputRotationY,
                        inputRotationZ: layer.customAnimation.end.inputRotationZ
                    }
                },

                // Include separated controls in AR export
                separatedControls: layer.separatedControls ? {
                    position: {
                        x: layer.separatedControls.position?.x || 0,
                        y: layer.separatedControls.position?.y || 0,
                        z: layer.separatedControls.position?.z || 0
                    },
                    rotation: {
                        x: layer.separatedControls.rotation?.x || 0,
                        y: layer.separatedControls.rotation?.y || 0,
                        z: layer.separatedControls.rotation?.z || 0
                    },
                    scale: layer.separatedControls.scale || 1,
                    opacity: layer.separatedControls.opacity || 1
                } : {
                    position: { x: 0, y: 0, z: 0 },
                    rotation: { x: 0, y: 0, z: 0 },
                    scale: 1,
                    opacity: 1
                },

                specialEffectSettings: layer.specialEffectSettings,
                isAnimating: layer.animation !== null,
                materialProperties: {
                    transparent: layer.mesh.material.transparent,
                    side: layer.mesh.material.side,
                    alphaTest: layer.mesh.material.alphaTest
                }
            };
            layersData.push(layerData);
        }

        // ... rest of the function remains the same
    } catch (error) {
        console.error('Error adding JSON model data to AR package:', error);
    }

    // Generate and save the zip file
    try {
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, name + "_AR_Package.zip");
        console.log(`AR Package exported successfully with separated controls: ${name}_AR_Package.zip`);
    } catch (error) {
        console.error('Error generating zip file:', error);
    }
}
// ...existing code...

function sanitizeFileName(fileName) {
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    return nameWithoutExt
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_{2,}/g, '_')
        .trim();
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// Export model to JSON file
function getCleanValue(originalValue, currentValue) {
    // If we have an original input value stored, use it
    if (originalValue !== undefined && originalValue !== null) {
        return originalValue;
    }
    // Otherwise, clean the current value to remove floating point errors
    if (typeof currentValue === 'number') {
        // Only clean if it's clearly a floating point error (many decimal places)
        const str = currentValue.toString();
        if (str.includes('.') && str.split('.')[1].length > 6) {
            // Round to remove floating point precision errors
            return Math.round(currentValue * 1000000) / 1000000;
        }
    }
    return currentValue;
}

// Helper function to get clean transform values
function getCleanTransform(originalTransform, currentTransform) {
    return {
        x: getCleanValue(originalTransform?.x, currentTransform.x),
        y: getCleanValue(originalTransform?.y, currentTransform.y),
        z: getCleanValue(originalTransform?.z, currentTransform.z)
    };
}

async function exportAsModel() {
    const projectName = document.getElementById('projectName').value;
    const bgColor = document.getElementById('bgColor').value;
    const websiteUrl = document.getElementById('websiteUrl').value;

    // Prepare layers data with preserved input values
    const layersData = [];

    for (const layer of imageLayers) {
        // Convert texture to base64
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Get image from texture
        const img = layer.texture.image;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = canvas.toDataURL('image/png');

        const layerData = {
            id: layer.id,
            name: layer.name,
            imageData: imageData,
            imageDetails: {
                width: img.width,
                height: img.height,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight
            },
            // Current mesh state - PRESERVE INPUT VALUES
            position: getCleanTransform(layer.inputPosition, layer.mesh.position),
            rotation: getCleanRotation(layer.inputRotation, layer.mesh.rotation),
            scale: getCleanTransform(layer.inputScale, layer.mesh.scale),
            opacity: getCleanValue(layer.inputOpacity, layer.mesh.material.opacity),

            // Original/base state - PRESERVE INPUT VALUES
            originalPosition: getCleanTransform(layer.originalInputPosition, layer.originalPosition),
            originalRotation: getCleanRotation(layer.originalInputRotation, layer.originalRotation),
            originalScale: getCleanTransform(layer.originalInputScale, layer.originalScale),
            originalOpacity: getCleanValue(layer.originalInputOpacity, layer.originalOpacity),

            // Store input values for future reference
            inputPosition: layer.inputPosition,
            inputRotation: layer.inputRotation,
            inputScale: layer.inputScale,
            inputOpacity: layer.inputOpacity,
            originalInputPosition: layer.originalInputPosition,
            originalInputRotation: layer.originalInputRotation,
            originalInputScale: layer.originalInputScale,
            originalInputOpacity: layer.originalInputOpacity,

            // Animation settings
            enableCustomAnimation: layer.enableCustomAnimation,
            specialEffect: layer.specialEffect,
            animationSpeed: getCleanValue(layer.inputAnimationSpeed, layer.animationSpeed),
            animationDuration: getCleanValue(layer.inputAnimationDuration, layer.animationDuration),
            loopAnimation: layer.loopAnimation,

            // Custom animation with preserved input values
            customAnimation: {
                start: {
                    x: getCleanValue(layer.customAnimation.start.inputX, layer.customAnimation.start.x),
                    y: getCleanValue(layer.customAnimation.start.inputY, layer.customAnimation.start.y),
                    z: getCleanValue(layer.customAnimation.start.inputZ, layer.customAnimation.start.z),
                    scale: getCleanValue(layer.customAnimation.start.inputScale, layer.customAnimation.start.scale),
                    opacity: getCleanValue(layer.customAnimation.start.inputOpacity, layer.customAnimation.start.opacity),
                    rotationX: getCleanValue(layer.customAnimation.start.inputRotationX, layer.customAnimation.start.rotationX),
                    rotationY: getCleanValue(layer.customAnimation.start.inputRotationY, layer.customAnimation.start.rotationY),
                    rotationZ: getCleanValue(layer.customAnimation.start.inputRotationZ, layer.customAnimation.start.rotationZ),
                    // Store input values
                    inputX: layer.customAnimation.start.inputX,
                    inputY: layer.customAnimation.start.inputY,
                    inputZ: layer.customAnimation.start.inputZ,
                    inputScale: layer.customAnimation.start.inputScale,
                    inputOpacity: layer.customAnimation.start.inputOpacity,
                    inputRotationX: layer.customAnimation.start.inputRotationX,
                    inputRotationY: layer.customAnimation.start.inputRotationY,
                    inputRotationZ: layer.customAnimation.start.inputRotationZ
                },
                end: {
                    x: getCleanValue(layer.customAnimation.end.inputX, layer.customAnimation.end.x),
                    y: getCleanValue(layer.customAnimation.end.inputY, layer.customAnimation.end.y),
                    z: getCleanValue(layer.customAnimation.end.inputZ, layer.customAnimation.end.z),
                    scale: getCleanValue(layer.customAnimation.end.inputScale, layer.customAnimation.end.scale),
                    opacity: getCleanValue(layer.customAnimation.end.inputOpacity, layer.customAnimation.end.opacity),
                    rotationX: getCleanValue(layer.customAnimation.end.inputRotationX, layer.customAnimation.end.rotationX),
                    rotationY: getCleanValue(layer.customAnimation.end.inputRotationY, layer.customAnimation.end.rotationY),
                    rotationZ: getCleanValue(layer.customAnimation.end.inputRotationZ, layer.customAnimation.end.rotationZ),
                    // Store input values
                    inputX: layer.customAnimation.end.inputX,
                    inputY: layer.customAnimation.end.inputY,
                    inputZ: layer.customAnimation.end.inputZ,
                    inputScale: layer.customAnimation.end.inputScale,
                    inputOpacity: layer.customAnimation.end.inputOpacity,
                    inputRotationX: layer.customAnimation.end.inputRotationX,
                    inputRotationY: layer.customAnimation.end.inputRotationY,
                    inputRotationZ: layer.customAnimation.end.inputRotationZ
                }
            },

            separatedControls: {
                position: {
                    x: layer.separatedControls?.position?.x ?? 0,
                    y: layer.separatedControls?.position?.y ?? 0,
                    z: layer.separatedControls?.position?.z ?? 0,
                },
                rotation: {
                    x: layer.separatedControls?.rotation?.x ?? 0,
                    y: layer.separatedControls?.rotation?.y ?? 0,
                    z: layer.separatedControls?.rotation?.z ?? 0,
                },
                scale: layer.separatedControls?.scale ?? 1,
                opacity: layer.separatedControls?.opacity ?? 1,
            },
            specialEffectSettings: layer.specialEffectSettings,
            isAnimating: layer.animation !== null,
            materialProperties: {
                transparent: layer.mesh.material.transparent,
                side: layer.mesh.material.side,
                alphaTest: layer.mesh.material.alphaTest
            }
        };

        layersData.push(layerData);
    }
}

// Load model from JSON file
async function loadModel(modelData) {
    try {
        // Validate model data
        if (!modelData || !modelData.version || !modelData.layers) {
            throw new Error('Invalid model file format');
        }

        console.log(`Loading model: ${modelData.projectName} (v${modelData.version})`);

        // Clear existing layers and audio
        clearAllLayers();
        clearAllAudio();

        // Restore project settings
        if (modelData.projectName) {
            document.getElementById('projectName').value = modelData.projectName;
        }

        if (modelData.settings) {
            if (modelData.settings.backgroundColor) {
                document.getElementById('bgColor').value = modelData.settings.backgroundColor;
                updateBackgroundColor();
            }

            if (modelData.settings.websiteUrl) {
                document.getElementById('websiteUrl').value = modelData.settings.websiteUrl;
            }

            // Restore camera position
            if (modelData.settings.camera && camera) {
                const camPos = modelData.settings.camera.position;
                const camRot = modelData.settings.camera.rotation;

                if (camPos) {
                    camera.position.set(camPos.x, camPos.y, camPos.z);
                }
                if (camRot) {
                    camera.rotation.set(camRot.x, camRot.y, camRot.z);
                }
            }
        }

        // Restore global timeline settings
        if (modelData.globalTimeline) {
            globalTimeline.loop = modelData.globalTimeline.loop;
            globalTimeline.duration = modelData.globalTimeline.duration;

            const loopCheckbox = document.getElementById('timeline-loop');
            if (loopCheckbox) {
                loopCheckbox.checked = globalTimeline.loop;
            }
        }

        // Load layers with full animation settings
        for (const layerData of modelData.layers) {
            await loadLayerFromData(layerData);
        }

        // Load audio tracks with timeline settings
        if (modelData.audio && Array.isArray(modelData.audio)) {
            for (const audioData of modelData.audio) {
                await loadAudioFromData(audioData);
            }
        }

        // Update displays
        updateLayersList();
        updateTimelineDuration();

        // If there are layers, select the first one
        if (imageLayers.length > 0) {
            selectLayer(imageLayers[0]);
        }

        console.log('Model loaded successfully');
        alert('Model loaded successfully!');

    } catch (error) {
        console.error('Load failed:', error);
        alert('Load failed: ' + error.message);
    }
}

async function loadLayerFromData(layerData) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = function () {
            try {
                // Create texture
                const texture = new THREE.Texture(img);
                texture.needsUpdate = true;
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;

                // Create geometry and material
                const aspect = img.width / img.height;
                const geometry = new THREE.PlaneGeometry(2 * aspect, 2);
                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: layerData.materialProperties?.transparent !== false,
                    side: layerData.materialProperties?.side || THREE.DoubleSide,
                    alphaTest: layerData.materialProperties?.alphaTest || 0.1
                });

                // Create mesh
                const mesh = new THREE.Mesh(geometry, material);

                // Apply position, rotation, scale, opacity
                mesh.position.set(layerData.position.x, layerData.position.y, layerData.position.z);

                // Handle rotation - convert from degrees to radians
                let rotX = layerData.rotation.x;
                let rotY = layerData.rotation.y;
                let rotZ = layerData.rotation.z;

                // Convert to radians if needed
                if (Math.abs(rotX) > Math.PI || Math.abs(rotY) > Math.PI || Math.abs(rotZ) > Math.PI) {
                    rotX = rotX * Math.PI / 180;
                    rotY = rotY * Math.PI / 180;
                    rotZ = rotZ * Math.PI / 180;
                }

                mesh.rotation.set(rotX, rotY, rotZ);
                mesh.scale.set(layerData.scale.x, layerData.scale.y, layerData.scale.z);
                mesh.material.opacity = layerData.opacity;

                // Create layer object with full animation settings
                const layer = {
                    id: layerData.id,
                    name: layerData.name,
                    mesh: mesh,
                    texture: texture,
                    originalPosition: layerData.originalPosition,
                    originalRotation: layerData.originalRotation,
                    originalScale: layerData.originalScale,
                    originalOpacity: layerData.originalOpacity,
                    animation: null,
                    enableCustomAnimation: layerData.enableCustomAnimation,
                    specialEffect: layerData.specialEffect,
                    animationSpeed: layerData.animationSpeed,
                    animationDuration: layerData.animationDuration,
                    loopAnimation: layerData.loopAnimation,
                    
                    // Handle both old and new rotation formats
                    customAnimation: layerData.customAnimation ? {
                        start: {
                            ...layerData.customAnimation.start,
                            // Convert old rotation format to new format if needed
                            rotationX: layerData.customAnimation.start.rotationX ?? 0,
                            rotationY: layerData.customAnimation.start.rotationY ?? 0,
                            rotationZ: layerData.customAnimation.start.rotationZ ?? layerData.customAnimation.start.rotation ?? 0,
                            inputRotationX: layerData.customAnimation.start.inputRotationX ?? 0,
                            inputRotationY: layerData.customAnimation.start.inputRotationY ?? 0,
                            inputRotationZ: layerData.customAnimation.start.inputRotationZ ?? layerData.customAnimation.start.inputRotation ?? 0
                        },
                        end: {
                            ...layerData.customAnimation.end,
                            // Convert old rotation format to new format if needed
                            rotationX: layerData.customAnimation.end.rotationX ?? 0,
                            rotationY: layerData.customAnimation.end.rotationY ?? 0,
                            rotationZ: layerData.customAnimation.end.rotationZ ?? layerData.customAnimation.end.rotation ?? 0,
                            inputRotationX: layerData.customAnimation.end.inputRotationX ?? 0,
                            inputRotationY: layerData.customAnimation.end.inputRotationY ?? 0,
                            inputRotationZ: layerData.customAnimation.end.inputRotationZ ?? layerData.customAnimation.end.inputRotation ?? 0
                        }
                    } : {
                        start: { x: 0, y: 0, z: 0, scale: 1, opacity: 1, rotationX: 0, rotationY: 0, rotationZ: 0 },
                        end: { x: 0, y: 0, z: 0, scale: 1, opacity: 1, rotationX: 0, rotationY: 0, rotationZ: 0 }
                    },

                    // Restore separated controls
                    separatedControls: layerData.separatedControls ? {
                        position: {
                            x: layerData.separatedControls.position?.x || 0,
                            y: layerData.separatedControls.position?.y || 0,
                            z: layerData.separatedControls.position?.z || 0
                        },
                        rotation: {
                            x: layerData.separatedControls.rotation?.x || 0,
                            y: layerData.separatedControls.rotation?.y || 0,
                            z: layerData.separatedControls.rotation?.z || 0
                        },
                        scale: layerData.separatedControls.scale || 1,
                        opacity: layerData.separatedControls.opacity || 1
                    } : {
                        position: { x: 0, y: 0, z: 0 },
                        rotation: { x: 0, y: 0, z: 0 },
                        scale: 1,
                        opacity: 1
                    },

                    specialEffectSettings: layerData.specialEffectSettings,

                    // Restore input values
                    inputPosition: layerData.inputPosition,
                    inputRotation: layerData.inputRotation,
                    inputScale: layerData.inputScale,
                    inputOpacity: layerData.inputOpacity,
                    originalInputPosition: layerData.originalInputPosition,
                    originalInputRotation: layerData.originalInputRotation,
                    originalInputScale: layerData.originalInputScale,
                    originalInputOpacity: layerData.originalInputOpacity,

                    // Image properties for AR export
                    imageAspect: aspect,
                    imageWidth: img.width,
                    imageHeight: img.height,
                    baseSize: 2
                };

                // Add to scene and layers array
                imageLayers.push(layer);
                if (scene) {
                    scene.add(mesh);
                }

                resolve(layer);

            } catch (error) {
                reject(error);
            }
        };

        img.onerror = () => {
            reject(new Error(`Failed to load image for layer: ${layerData.name}`));
        };

        // Load image from base64 data
        img.src = layerData.imageData;
    });
}


function roundToDecimal(value, decimals = 1) {
    return Number(Math.round(parseFloat(value + 'e' + decimals)) + 'e-' + decimals);
}

async function loadAudioFromData(audioData) {
    try {
        if (!audioData.audioData) {
            console.warn(`Skipping audio track ${audioData.name} - no audio data`);
            return;
        }

        const response = await fetch(audioData.audioData);
        const blob = await response.blob();

        const audioElement = new Audio();
        audioElement.src = URL.createObjectURL(blob);
        audioElement.loop = audioData.loop;
        audioElement.volume = audioData.volume;

        if (audioData.currentTime) {
            audioElement.currentTime = audioData.currentTime;
        }

        const startTime = audioData.startTime ? roundToDecimal(audioData.startTime) : 0;
        const endTime = audioData.endTime ? roundToDecimal(audioData.endTime) : null;
        const duration = audioData.duration ? roundToDecimal(audioData.duration) : null;

        const track = {
            id: audioData.id || 'audio_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: audioData.name,
            audio: audioElement,
            isPlaying: false,
            startTime: startTime,
            endTime: endTime,
            duration: duration,
            timelineActive: false,
            playOrder: audioData.playOrder,
            isBackground: audioData.isBackground
        };

        audioTracks.push(track);

        createAudioTrackUI(track);

        setTimeout(() => {
            if (track.startTime !== undefined) {
                const startInput = document.querySelector(`#${track.id} input[onchange*="start"]`);
                if (startInput) startInput.value = track.startTime;
            }
            if (track.endTime !== undefined) {
                const endInput = document.querySelector(`#${track.id} input[onchange*="end"]`);
                if (endInput) endInput.value = track.endTime;
            }
            updateTimelineStatus(track.id);
        }, 100);

        console.log(`Loaded audio track: ${track.name}`);

    } catch (error) {
        console.error(`Failed to load audio track ${audioData.name}:`, error);
    }
}

// Helper function to clear all layers
function clearAllLayers() {
    // Remove meshes from scene
    imageLayers.forEach(layer => {
        if (scene) {
            scene.remove(layer.mesh);
        }
        if (layer.animation) {
            layer.animation.stop();
        }
    });

    // Clear arrays
    imageLayers.length = 0;
    selectedLayer = null;
}

// Helper function to clear all audio
function clearAllAudio() {
    // Stop timeline first
    if (typeof stopTimeline === 'function') {
        stopTimeline();
    }

    // Stop and cleanup audio
    audioTracks.forEach(track => {
        track.audio.pause();
        URL.revokeObjectURL(track.audio.src);
    });

    // Clear arrays
    audioTracks.length = 0;

    // Clear audio tracks UI
    const tracksContainer = document.getElementById('audioTracks');
    if (tracksContainer) {
        tracksContainer.innerHTML = '';
    }
}

// File input handler for loading projects
function handleProjectFileSelect(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const modelData = JSON.parse(e.target.result);
            loadModel(modelData);
        } catch (error) {
            console.error('Failed to parse project file:', error);
            alert('Invalid project file format');
        }
    };
    reader.readAsText(file);

    // Clear the input
    input.value = '';
}

// Function to trigger file selection for loading
function loadProjectFromFile() {
    const fileInput = document.getElementById('projectFileInput');
    if (fileInput) {
        fileInput.click();
    } else {
        console.error('Project file input not found');
        alert('Project file input not found. Please check your HTML.');
    }
}