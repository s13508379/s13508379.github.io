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
    
    // Validate and clamp values within bounds
    settings.swingRange = clampValue(parseFloat(document.getElementById('swingRange').value), 10, 180);
    settings.swingFreq = clampValue(parseFloat(document.getElementById('swingFreq').value), 2, 16);
    settings.swingTargetX = clampValue(parseFloat(document.getElementById('swingTargetX').value), 0, 10);
    settings.zigzagAmp = clampValue(parseFloat(document.getElementById('zigzagAmp').value), 0.5, 5);
    settings.zigzagFreq = clampValue(parseFloat(document.getElementById('zigzagFreq').value), 2, 12);
    settings.zigzagTargetX = clampValue(parseFloat(document.getElementById('zigzagTargetX').value), 0, 10);
    settings.zigzagTargetY = clampValue(parseFloat(document.getElementById('zigzagTargetY').value), 0, 10);
    settings.pendulumRange = clampValue(parseFloat(document.getElementById('pendulumRange').value), 10, 120);
    settings.pendulumSpeed = clampValue(parseFloat(document.getElementById('pendulumSpeed').value), 0.5, 5);
    settings.waveAmp = clampValue(parseFloat(document.getElementById('waveAmp').value), 0.5, 5);
    settings.waveFreq = clampValue(parseFloat(document.getElementById('waveFreq').value), 1, 10);
    settings.waveTargetX = clampValue(parseFloat(document.getElementById('waveTargetX').value), 0, 10);
    settings.waveTargetY = clampValue(parseFloat(document.getElementById('waveTargetY').value), 0, 10);
    settings.bounceHeight = clampValue(parseFloat(document.getElementById('bounceHeight').value), 0.5, 10);
    settings.bounceFreq = clampValue(parseFloat(document.getElementById('bounceFreq').value), 1, 10);
    settings.spiralRadius = clampValue(parseFloat(document.getElementById('spiralRadius').value), 1, 10);
    settings.spiralRotations = clampValue(parseFloat(document.getElementById('spiralRotations').value), 1, 15);
    settings.slideDistance = clampValue(parseFloat(document.getElementById('slideDistance').value), 2, 20);
    settings.rotateCycles = clampValue(parseFloat(document.getElementById('rotateCycles').value), 0.25, 5);
}

// Utility function to clamp values within bounds
function clampValue(value, min, max) {
    if (isNaN(value)) return min;
    return Math.max(min, Math.min(max, value));
}

// Update custom animation values
function updateCustomValues() {
    if (!selectedLayer) return;

    // Get values with validation
    const startX = clampValue(parseFloat(document.getElementById('startX').value), -15, 15);
    const startY = clampValue(parseFloat(document.getElementById('startY').value), -15, 15);
    const startZ = clampValue(parseFloat(document.getElementById('startZ').value), -15, 15);
    const startScale = clampValue(parseFloat(document.getElementById('startScale').value), 0.1, 5);
    const startOpacity = clampValue(parseFloat(document.getElementById('startOpacity').value), 0, 1);
    const startRotation = clampValue(parseFloat(document.getElementById('startRotation').value), -360, 360);

    const endX = clampValue(parseFloat(document.getElementById('endX').value), -15, 15);
    const endY = clampValue(parseFloat(document.getElementById('endY').value), -15, 15);
    const endZ = clampValue(parseFloat(document.getElementById('endZ').value), -15, 15);
    const endScale = clampValue(parseFloat(document.getElementById('endScale').value), 0.1, 5);
    const endOpacity = clampValue(parseFloat(document.getElementById('endOpacity').value), 0, 1);
    const endRotation = clampValue(parseFloat(document.getElementById('endRotation').value), -360, 360);

    selectedLayer.customAnimation = {
        start: {
            x: startX,
            y: startY,
            z: startZ,
            scale: startScale,
            opacity: startOpacity,
            rotation: startRotation
        },
        end: {
            x: endX,
            y: endY,
            z: endZ,
            scale: endScale,
            opacity: endOpacity,
            rotation: endRotation
        }
    };
}

// Update position
function updatePosition() {
    if (!selectedLayer) return;

    const x = clampValue(parseFloat(document.getElementById('xPos').value), -10, 10);
    const y = clampValue(parseFloat(document.getElementById('yPos').value), -10, 10);
    const z = clampValue(parseFloat(document.getElementById('zPos').value), -10, 10);

    selectedLayer.mesh.position.set(x, y, z);
    selectedLayer.originalPosition = { x, y, z };
    
    // Update the input values in case they were clamped
    document.getElementById('xPos').value = x;
    document.getElementById('yPos').value = y;
    document.getElementById('zPos').value = z;
}

// Update rotation
function updateRotation() {
    if (!selectedLayer) return;

    const xDeg = clampValue(parseFloat(document.getElementById('rotX').value), -180, 180);
    const yDeg = clampValue(parseFloat(document.getElementById('rotY').value), -180, 180);
    const zDeg = clampValue(parseFloat(document.getElementById('rotZ').value), -180, 180);

    const x = xDeg * Math.PI / 180;
    const y = yDeg * Math.PI / 180;
    const z = zDeg * Math.PI / 180;

    selectedLayer.mesh.rotation.set(x, y, z);
    selectedLayer.originalRotation = { x, y, z };
    
    // Update the input values in case they were clamped
    document.getElementById('rotX').value = xDeg;
    document.getElementById('rotY').value = yDeg;
    document.getElementById('rotZ').value = zDeg;
}

// Update transparency
function updateTransparency() {
    if (!selectedLayer) return;

    const alpha = clampValue(parseFloat(document.getElementById('alpha').value), 0, 1);
    selectedLayer.mesh.material.opacity = alpha;
    selectedLayer.originalOpacity = alpha;
    
    // Update the input value in case it was clamped
    document.getElementById('alpha').value = alpha;
}

// Update scale
function updateScale() {
    if (!selectedLayer) return;

    const scale = clampValue(parseFloat(document.getElementById('scale').value), 0.1, 5);
    selectedLayer.mesh.scale.set(scale, scale, scale);
    selectedLayer.originalScale = { x: scale, y: scale, z: scale };
    
    // Update the input value in case it was clamped
    document.getElementById('scale').value = scale;
}

// Update animation speed
function updateAnimationSpeed() {
    if (!selectedLayer) return;
    
    const speed = clampValue(parseFloat(document.getElementById('animationSpeed').value), 0.1, 3);
    selectedLayer.animationSpeed = speed;
    
    // Update the input value in case it was clamped
    document.getElementById('animationSpeed').value = speed;
}

// Update animation duration
function updateAnimationDuration() {
    if (!selectedLayer) return;
    
    const duration = clampValue(parseFloat(document.getElementById('animationDuration').value), 0.5, 100);
    selectedLayer.animationDuration = duration;
    
    // Update the input value in case it was clamped
    document.getElementById('animationDuration').value = duration;
}

// Function to update UI controls when a layer is selected
function updateUIControls(layer) {
    if (!layer) return;

    // Update position controls
    document.getElementById('xPos').value = layer.originalPosition?.x || 0;
    document.getElementById('yPos').value = layer.originalPosition?.y || 0;
    document.getElementById('zPos').value = layer.originalPosition?.z || 0;

    // Update rotation controls (convert from radians to degrees)
    document.getElementById('rotX').value = layer.originalRotation?.x ? (layer.originalRotation.x * 180 / Math.PI) : 0;
    document.getElementById('rotY').value = layer.originalRotation?.y ? (layer.originalRotation.y * 180 / Math.PI) : 0;
    document.getElementById('rotZ').value = layer.originalRotation?.z ? (layer.originalRotation.z * 180 / Math.PI) : 0;

    // Update other controls
    document.getElementById('scale').value = layer.originalScale?.x || 1;
    document.getElementById('alpha').value = layer.originalOpacity || 1;
    document.getElementById('animationSpeed').value = layer.animationSpeed || 1;
    document.getElementById('animationDuration').value = layer.animationDuration || 2;

    // Update special effect controls
    if (layer.specialEffect) {
        document.getElementById('specialEffect').value = layer.specialEffect;
        updateSpecialEffect();
    }

    // Update custom animation controls if they exist
    if (layer.customAnimation) {
        document.getElementById('startX').value = layer.customAnimation.start.x || 0;
        document.getElementById('startY').value = layer.customAnimation.start.y || 0;
        document.getElementById('startZ').value = layer.customAnimation.start.z || 0;
        document.getElementById('startScale').value = layer.customAnimation.start.scale || 1;
        document.getElementById('startOpacity').value = layer.customAnimation.start.opacity || 1;
        document.getElementById('startRotation').value = layer.customAnimation.start.rotation || 0;

        document.getElementById('endX').value = layer.customAnimation.end.x || 0;
        document.getElementById('endY').value = layer.customAnimation.end.y || 0;
        document.getElementById('endZ').value = layer.customAnimation.end.z || 0;
        document.getElementById('endScale').value = layer.customAnimation.end.scale || 1;
        document.getElementById('endOpacity').value = layer.customAnimation.end.opacity || 1;
        document.getElementById('endRotation').value = layer.customAnimation.end.rotation || 0;
    }
}

// Add input validation event listeners
function addInputValidation() {
    // Add validation for all number inputs
    const numberInputs = document.querySelectorAll('input[type="number"]');
    
    numberInputs.forEach(input => {
        input.addEventListener('blur', function() {
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
        
        input.addEventListener('keydown', function(e) {
            // Allow Enter key to trigger blur event
            if (e.key === 'Enter') {
                this.blur();
            }
        });
    });
}

// Initialize validation when the page loads
document.addEventListener('DOMContentLoaded', function() {
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