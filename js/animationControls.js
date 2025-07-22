// animationControls.js - Updated with AR.js coordinate system mapping

// Update special effect and show relevant controls
function updateSpecialEffect() {
    const specialEffect = document.getElementById('specialEffect').value;
    const specialControls = document.getElementById('specialEffectControls');

    // Hide all effect-specific controls
    document.getElementById('swingControls').style.display = 'none';
    document.getElementById('zigzagControls').style.display = 'none';
    document.getElementById('pendulumControls').style.display = 'none';
    document.getElementById('waveControls').style.display = 'none';
    document.getElementById('bounceControls').style.display = 'none';
    document.getElementById('spiralControls').style.display = 'none';
    document.getElementById('slideControls').style.display = 'none';
    document.getElementById('rotateControls').style.display = 'none';

    if (specialEffect === 'none') {
        specialControls.style.display = 'none';
    } else {
        specialControls.style.display = 'block';

        // Show relevant controls based on effect
        switch (specialEffect) {
            case 'swingToTarget':
                document.getElementById('swingControls').style.display = 'block';
                break;
            case 'zigzagToTarget':
                document.getElementById('zigzagControls').style.display = 'block';
                break;
            case 'pendulumMove':
                document.getElementById('pendulumControls').style.display = 'block';
                break;
            case 'waveToTarget':
                document.getElementById('waveControls').style.display = 'block';
                break;
            case 'bounce':
                document.getElementById('bounceControls').style.display = 'block';
                break;
            case 'spiral':
                document.getElementById('spiralControls').style.display = 'block';
                break;
            case 'slideDown':
            case 'slideUp':
            case 'slideLeft':
            case 'slideRight':
                document.getElementById('slideControls').style.display = 'block';
                break;
            case 'rotate':
                document.getElementById('rotateControls').style.display = 'block';
                break;
        }
    }

    if (selectedLayer) {
        selectedLayer.specialEffect = specialEffect;
    }
}

// Update special effect settings
function updateSpecialEffectSettings() {
    if (!selectedLayer) return;

    const settings = selectedLayer.specialEffectSettings;

    // Store original input values AND apply clamped values
    const swingRange = parseFloat(document.getElementById('swingRange').value);
    const swingFreq = parseFloat(document.getElementById('swingFreq').value);
    const swingTargetX = parseFloat(document.getElementById('swingTargetX').value);
    const zigzagAmp = parseFloat(document.getElementById('zigzagAmp').value);
    const zigzagFreq = parseFloat(document.getElementById('zigzagFreq').value);
    const zigzagTargetX = parseFloat(document.getElementById('zigzagTargetX').value);
    const zigzagTargetY = parseFloat(document.getElementById('zigzagTargetY').value);
    const pendulumRange = parseFloat(document.getElementById('pendulumRange').value);
    const pendulumSpeed = parseFloat(document.getElementById('pendulumSpeed').value);
    const waveAmp = parseFloat(document.getElementById('waveAmp').value);
    const waveFreq = parseFloat(document.getElementById('waveFreq').value);
    const waveTargetX = parseFloat(document.getElementById('waveTargetX').value);
    const waveTargetY = parseFloat(document.getElementById('waveTargetY').value);
    const bounceHeight = parseFloat(document.getElementById('bounceHeight').value);
    const bounceFreq = parseFloat(document.getElementById('bounceFreq').value);
    const spiralRadius = parseFloat(document.getElementById('spiralRadius').value);
    const spiralRotations = parseFloat(document.getElementById('spiralRotations').value);
    const slideDistance = parseFloat(document.getElementById('slideDistance').value);
    const rotateCycles = parseFloat(document.getElementById('rotateCycles').value);

    // Store original input values
    if (!settings.inputValues) settings.inputValues = {};
    settings.inputValues.swingRange = swingRange;
    settings.inputValues.swingFreq = swingFreq;
    settings.inputValues.swingTargetX = swingTargetX;
    settings.inputValues.zigzagAmp = zigzagAmp;
    settings.inputValues.zigzagFreq = zigzagFreq;
    settings.inputValues.zigzagTargetX = zigzagTargetX;
    settings.inputValues.zigzagTargetY = zigzagTargetY;
    settings.inputValues.pendulumRange = pendulumRange;
    settings.inputValues.pendulumSpeed = pendulumSpeed;
    settings.inputValues.waveAmp = waveAmp;
    settings.inputValues.waveFreq = waveFreq;
    settings.inputValues.waveTargetX = waveTargetX;
    settings.inputValues.waveTargetY = waveTargetY;
    settings.inputValues.bounceHeight = bounceHeight;
    settings.inputValues.bounceFreq = bounceFreq;
    settings.inputValues.spiralRadius = spiralRadius;
    settings.inputValues.spiralRotations = spiralRotations;
    settings.inputValues.slideDistance = slideDistance;
    settings.inputValues.rotateCycles = rotateCycles;

    // Apply clamped values for actual use
    settings.swingRange = clampValue(swingRange, 10, 180);
    settings.swingFreq = clampValue(swingFreq, 2, 16);
    settings.swingTargetX = clampValue(swingTargetX, 0, 10);
    settings.zigzagAmp = clampValue(zigzagAmp, 0.5, 5);
    settings.zigzagFreq = clampValue(zigzagFreq, 2, 12);
    settings.zigzagTargetX = clampValue(zigzagTargetX, 0, 10);
    settings.zigzagTargetY = clampValue(zigzagTargetY, 0, 10);
    settings.pendulumRange = clampValue(pendulumRange, 10, 120);
    settings.pendulumSpeed = clampValue(pendulumSpeed, 0.5, 5);
    settings.waveAmp = clampValue(waveAmp, 0.5, 5);
    settings.waveFreq = clampValue(waveFreq, 1, 10);
    settings.waveTargetX = clampValue(waveTargetX, 0, 10);
    settings.waveTargetY = clampValue(waveTargetY, 0, 10);
    settings.bounceHeight = clampValue(bounceHeight, 0.5, 10);
    settings.bounceFreq = clampValue(bounceFreq, 1, 10);
    settings.spiralRadius = clampValue(spiralRadius, 1, 10);
    settings.spiralRotations = clampValue(spiralRotations, 1, 15);
    settings.slideDistance = clampValue(slideDistance, 2, 20);
    settings.rotateCycles = clampValue(rotateCycles, 0.25, 5);
}

// Utility function to clamp values within bounds
function clampValue(value, min, max) {
    if (isNaN(value)) return min;
    return Math.max(min, Math.min(max, value));
}

// Coordinate conversion functions for AR.js compatibility (1:1 mapping)
function convertToARJSCoordinates(threeJSPosition) {
    // 1:1 coordinate mapping - no conversion needed
    // Both Three.js and AR.js use the same coordinate system
    return {
        x: threeJSPosition.x,      // X remains exactly the same
        y: threeJSPosition.y,      // Y remains exactly the same
        z: threeJSPosition.z       // Z remains exactly the same (no flip)
    };
}

function convertFromARJSCoordinates(arjsPosition) {
    // 1:1 coordinate mapping - no conversion needed
    return {
        x: arjsPosition.x,      // X remains exactly the same
        y: arjsPosition.y,      // Y remains exactly the same
        z: arjsPosition.z       // Z remains exactly the same
    };
}

// Scale conversion functions for AR.js compatibility (1:1 mapping)
function convertScaleToARJS(threeJSScale) {
    // 1:1 scale mapping - what you see in Three.js is what you get in AR.js
    return {
        x: threeJSScale,
        y: threeJSScale,
        z: threeJSScale
    };
}

function convertScaleFromARJS(arjsScale) {
    // 1:1 scale mapping
    return arjsScale;
}

// Get optimal scale for AR viewing (1:1 mapping)
function getAROptimalScale(inputScale) {
    // Return the exact same scale - no adjustments
    return clampValue(inputScale, 0.1, 5); // Keep original range
}

// Update custom animation values with AR.js coordinate mapping
function updateCustomValues() {
    if (!selectedLayer) return;

    // Get original input values
    const startX = parseFloat(document.getElementById('startX').value);
    const startY = parseFloat(document.getElementById('startY').value);
    const startZ = parseFloat(document.getElementById('startZ').value);
    const startScale = parseFloat(document.getElementById('startScale').value);
    const startOpacity = parseFloat(document.getElementById('startOpacity').value);
    const startRotationX = parseFloat(document.getElementById('startRotationX').value);
    const startRotationY = parseFloat(document.getElementById('startRotationY').value);
    const startRotationZ = parseFloat(document.getElementById('startRotationZ').value);

    const endX = parseFloat(document.getElementById('endX').value);
    const endY = parseFloat(document.getElementById('endY').value);
    const endZ = parseFloat(document.getElementById('endZ').value);
    const endScale = parseFloat(document.getElementById('endScale').value);
    const endOpacity = parseFloat(document.getElementById('endOpacity').value);
    const endRotationX = parseFloat(document.getElementById('endRotationX').value);
    const endRotationY = parseFloat(document.getElementById('endRotationY').value);
    const endRotationZ = parseFloat(document.getElementById('endRotationZ').value);

    selectedLayer.customAnimation = {
        start: {
            // Store original input values
            inputX: startX,
            inputY: startY,
            inputZ: startZ,
            inputScale: startScale,
            inputOpacity: startOpacity,
            inputRotationX: startRotationX,
            inputRotationY: startRotationY,
            inputRotationZ: startRotationZ,
            // Clamped values for actual use (1:1 AR.js mapping)
            x: clampValue(startX, -15, 15),
            y: clampValue(startY, -15, 15),
            z: clampValue(startZ, -15, 15), // Same coordinates for AR.js
            scale: clampValue(startScale, 0.1, 5), // Same scale range
            opacity: clampValue(startOpacity, 0, 1),
            rotationX: clampValue(startRotationX, -360, 360),
            rotationY: clampValue(startRotationY, -360, 360),
            rotationZ: clampValue(startRotationZ, -360, 360)
        },
        end: {
            // Store original input values
            inputX: endX,
            inputY: endY,
            inputZ: endZ,
            inputScale: endScale,
            inputOpacity: endOpacity,
            inputRotationX: endRotationX,
            inputRotationY: endRotationY,
            inputRotationZ: endRotationZ,
            // Clamped values for actual use (1:1 AR.js mapping)
            x: clampValue(endX, -15, 15),
            y: clampValue(endY, -15, 15),
            z: clampValue(endZ, -15, 15), // Same coordinates for AR.js
            scale: clampValue(endScale, 0.1, 5), // Same scale range
            opacity: clampValue(endOpacity, 0, 1),
            rotationX: clampValue(endRotationX, -360, 360),
            rotationY: clampValue(endRotationY, -360, 360),
            rotationZ: clampValue(endRotationZ, -360, 360)
        }
    };
    
    // Custom animation values are independent of main controls
    console.log('Custom animation values updated independently');
}

// Update position with AR.js coordinate awareness
function updatePosition() {
    if (!selectedLayer) return;

    // Get original input values
    const inputX = parseFloat(document.getElementById('xPos').value);
    const inputY = parseFloat(document.getElementById('yPos').value);
    const inputZ = parseFloat(document.getElementById('zPos').value);

    // Store original input values
    selectedLayer.inputPosition = {
        x: inputX,
        y: inputY,
        z: inputZ
    };

    // Apply clamped values to mesh (Three.js coordinates for preview)
    const x = clampValue(inputX, -10, 10);
    const y = clampValue(inputY, -10, 10);
    const z = clampValue(inputZ, -10, 10);

    // If custom animation is enabled, main controls are separated - they don't affect the layer
    if (selectedLayer.enableCustomAnimation) {
        console.log('Animation mode: Position controls are separated from layer');
        
        // Store separated control values
        if (!selectedLayer.separatedControls) {
            selectedLayer.separatedControls = {
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: 1,
                opacity: 1
            };
        }
        selectedLayer.separatedControls.position = { x, y, z };
        
        // Update the input values in case they were clamped but don't apply to mesh
        document.getElementById('xPos').value = x;
        document.getElementById('yPos').value = y;
        document.getElementById('zPos').value = z;
        return; // Don't apply to mesh when animation is enabled
    }

    // Normal mode: directly update the layer
    selectedLayer.mesh.position.set(x, y, z);
    selectedLayer.originalPosition = { x, y, z };

    // Update the input values in case they were clamped (but preserve originals)
    document.getElementById('xPos').value = x;
    document.getElementById('yPos').value = y;
    document.getElementById('zPos').value = z;

    // Add visual indicator for 1:1 coordinate mapping
    console.log(`Three.js position: (${x}, ${y}, ${z})`);
    console.log(`AR.js position: (${x}, ${y}, ${z}) - 1:1 mapping`);
}

// Update rotation
function updateRotation() {
    if (!selectedLayer) return;

    // Get original input values (in degrees)
    const inputXDeg = parseFloat(document.getElementById('rotX').value);
    const inputYDeg = parseFloat(document.getElementById('rotY').value);
    const inputZDeg = parseFloat(document.getElementById('rotZ').value);

    // Store original input values
    selectedLayer.inputRotation = {
        x: inputXDeg,
        y: inputYDeg,
        z: inputZDeg
    };

    // Apply clamped values
    const xDeg = clampValue(inputXDeg, -180, 180);
    const yDeg = clampValue(inputYDeg, -180, 180);
    const zDeg = clampValue(inputZDeg, -180, 180);

    const x = xDeg * Math.PI / 180;
    const y = yDeg * Math.PI / 180;
    const z = zDeg * Math.PI / 180;

    // If custom animation is enabled, rotation controls are separated - they don't affect the layer
    if (selectedLayer.enableCustomAnimation) {
        console.log('Animation mode: Rotation controls are separated from layer');
        
        // Store separated control values
        if (!selectedLayer.separatedControls) {
            selectedLayer.separatedControls = {
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: 1,
                opacity: 1
            };
        }
        selectedLayer.separatedControls.rotation = { x: xDeg, y: yDeg, z: zDeg };
        
        // Update the input values in case they were clamped but don't apply to mesh
        document.getElementById('rotX').value = xDeg;
        document.getElementById('rotY').value = yDeg;
        document.getElementById('rotZ').value = zDeg;
        return; // Don't apply to mesh when animation is enabled
    }

    // Normal mode: directly update the layer
    selectedLayer.mesh.rotation.set(x, y, z);
    selectedLayer.originalRotation = { x: xDeg, y: yDeg, z: zDeg };

    document.getElementById('rotX').value = xDeg;
    document.getElementById('rotY').value = yDeg;
    document.getElementById('rotZ').value = zDeg;
}

// Update transparency
function updateTransparency() {
    if (!selectedLayer) return;
    const inputAlpha = parseFloat(document.getElementById('alpha').value);
    selectedLayer.inputOpacity = inputAlpha;
    const alpha = clampValue(inputAlpha, 0, 1);
    
    // If custom animation is enabled, transparency controls are separated - they don't affect the layer
    if (selectedLayer.enableCustomAnimation) {
        console.log('Animation mode: Transparency controls are separated from layer');
        
        // Store separated control values
        if (!selectedLayer.separatedControls) {
            selectedLayer.separatedControls = {
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: 1,
                opacity: 1
            };
        }
        selectedLayer.separatedControls.opacity = alpha;
        
        // Update the input value in case it was clamped but don't apply to mesh
        document.getElementById('alpha').value = alpha;
        return; // Don't apply to mesh when animation is enabled
    }
    
    // Normal mode: directly update the layer
    selectedLayer.mesh.material.opacity = alpha;
    selectedLayer.originalOpacity = alpha;
    document.getElementById('alpha').value = alpha;
}

// Update scale with 1:1 AR.js compatibility
function updateScale() {
    if (!selectedLayer) return;

    // Get original input value
    const inputScale = parseFloat(document.getElementById('scale').value);

    // Store original input value
    selectedLayer.inputScale = {
        x: inputScale,
        y: inputScale,
        z: inputScale
    };

    // Apply clamped value (same range as before for consistency)
    const scale = clampValue(inputScale, 0.1, 5); // Keep original range

    // If custom animation is enabled, scale controls are separated - they don't affect the layer
    if (selectedLayer.enableCustomAnimation) {
        console.log('Animation mode: Scale controls are separated from layer');
        
        // Store separated control values
        if (!selectedLayer.separatedControls) {
            selectedLayer.separatedControls = {
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: 1,
                opacity: 1
            };
        }
        selectedLayer.separatedControls.scale = scale;
        
        // Update the input value in case it was clamped but don't apply to mesh
        document.getElementById('scale').value = scale;
        return; // Don't apply to mesh when animation is enabled
    }

    // Normal mode: directly update the layer
    // For Three.js preview, use the exact same scale as AR.js will use
    selectedLayer.mesh.scale.set(scale, scale, scale);
    selectedLayer.originalScale = { x: scale, y: scale, z: scale };

    // Store the exact same scale for AR export (1:1 mapping)
    selectedLayer.arScale = scale;

    // Update the input value in case it was clamped
    document.getElementById('scale').value = scale;

    // Add visual feedback showing 1:1 mapping
    console.log(`Three.js scale: ${scale}`);
    console.log(`AR.js scale: ${scale} (1:1 mapping)`);

    // Update scale preview indicator if it exists
    const scaleIndicator = document.getElementById('arScaleIndicator');
    if (scaleIndicator) {
        scaleIndicator.textContent = scale.toFixed(2);
    }
}

function updateAnimationSpeed() {
    if (!selectedLayer) return;
    const inputSpeed = parseFloat(document.getElementById('animationSpeed').value);
    selectedLayer.inputAnimationSpeed = inputSpeed;
    const speed = clampValue(inputSpeed, 0.1, 3);
    selectedLayer.animationSpeed = speed;

    document.getElementById('animationSpeed').value = speed;
}

// Update animation duration
function updateAnimationDuration() {
    if (!selectedLayer) return;

    const inputDuration = parseFloat(document.getElementById('animationDuration').value);
    selectedLayer.inputAnimationDuration = inputDuration;
    const duration = clampValue(inputDuration, 0.5, 100);
    selectedLayer.animationDuration = duration;
    document.getElementById('animationDuration').value = duration;
}

// Function to update UI controls when a layer is selected
function updateUIControls(layer) {
    if (!layer) return;
    document.getElementById('xPos').value = layer.inputPosition?.x ?? layer.originalPosition?.x ?? 0;
    document.getElementById('yPos').value = layer.inputPosition?.y ?? layer.originalPosition?.y ?? 0;
    document.getElementById('zPos').value = layer.inputPosition?.z ?? layer.originalPosition?.z ?? 0;
    if (layer.inputRotation) {
        document.getElementById('rotX').value = layer.inputRotation.x;
        document.getElementById('rotY').value = layer.inputRotation.y;
        document.getElementById('rotZ').value = layer.inputRotation.z;
    } else {
        document.getElementById('rotX').value = layer.originalRotation?.x ? (layer.originalRotation.x * 180 / Math.PI) : 0;
        document.getElementById('rotY').value = layer.originalRotation?.y ? (layer.originalRotation.y * 180 / Math.PI) : 0;
        document.getElementById('rotZ').value = layer.originalRotation?.z ? (layer.originalRotation.z * 180 / Math.PI) : 0;
    }
    document.getElementById('scale').value = layer.inputScale?.x ?? layer.originalScale?.x ?? 1;
    document.getElementById('alpha').value = layer.inputOpacity ?? layer.originalOpacity ?? 1;
    document.getElementById('animationSpeed').value = layer.inputAnimationSpeed ?? layer.animationSpeed ?? 1;
    document.getElementById('animationDuration').value = layer.inputAnimationDuration ?? layer.animationDuration ?? 2;

    if (layer.specialEffect) {
        document.getElementById('specialEffect').value = layer.specialEffect;
        updateSpecialEffect();
    }

    if (layer.customAnimation) {
        const start = layer.customAnimation.start;
        const end = layer.customAnimation.end;

        document.getElementById('startX').value = start.inputX ?? start.x ?? 0;
        document.getElementById('startY').value = start.inputY ?? start.y ?? 0;
        document.getElementById('startZ').value = start.inputZ ?? start.z ?? 0;
        document.getElementById('startScale').value = start.inputScale ?? start.scale ?? 1;
        document.getElementById('startOpacity').value = start.inputOpacity ?? start.opacity ?? 1;
        document.getElementById('startRotationX').value = start.inputRotationX ?? start.rotationX ?? 0;
        document.getElementById('startRotationY').value = start.inputRotationY ?? start.rotationY ?? 0;
        document.getElementById('startRotationZ').value = start.inputRotationZ ?? start.rotationZ ?? 0;

        document.getElementById('endX').value = end.inputX ?? end.x ?? 0;
        document.getElementById('endY').value = end.inputY ?? end.y ?? 0;
        document.getElementById('endZ').value = end.inputZ ?? end.z ?? 0;
        document.getElementById('endScale').value = end.inputScale ?? end.scale ?? 1;
        document.getElementById('endOpacity').value = end.inputOpacity ?? end.opacity ?? 1;
        document.getElementById('endRotationX').value = end.inputRotationX ?? end.rotationX ?? 0;
        document.getElementById('endRotationY').value = end.inputRotationY ?? end.rotationY ?? 0;
        document.getElementById('endRotationZ').value = end.inputRotationZ ?? end.rotationZ ?? 0;
    }

    // Update special effect settings if they exist
    if (layer.specialEffectSettings?.inputValues) {
        const inputs = layer.specialEffectSettings.inputValues;
        Object.keys(inputs).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.value = inputs[key];
            }
        });
    }
}

// Add input validation event listeners
function addInputValidation() {
    // Add validation for all number inputs
    const numberInputs = document.querySelectorAll('input[type="number"]');

    numberInputs.forEach(input => {
        input.addEventListener('blur', function () {
            const min = parseFloat(this.min);
            const max = parseFloat(this.max);
            const value = parseFloat(this.value);

            if (isNaN(value)) {
                this.value = min;
            } else if (value < min) {
                this.value = min;
            } else if (value > max) {
                this.value = max;
            }

            // Trigger the appropriate update function
            if (this.oninput) {
                this.oninput();
            }
        });

        input.addEventListener('keydown', function (e) {
            // Allow Enter key to trigger blur event
            if (e.key === 'Enter') {
                this.blur();
            }
        });
    });
}

// Initialize validation when the page loads
document.addEventListener('DOMContentLoaded', function () {
    addInputValidation();
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    const currentTime = Date.now();
    imageLayers.forEach(layer => {
        if (layer.animation && layer.animation.update) {
            layer.animation.update(currentTime);
        }
    });

    renderer.render(scene, camera);
}