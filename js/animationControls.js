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
    settings.swingRange = parseFloat(document.getElementById('swingRange').value);
    settings.swingFreq = parseFloat(document.getElementById('swingFreq').value);
    settings.swingTargetX = parseFloat(document.getElementById('swingTargetX').value);
    settings.zigzagAmp = parseFloat(document.getElementById('zigzagAmp').value);
    settings.zigzagFreq = parseFloat(document.getElementById('zigzagFreq').value);
    settings.zigzagTargetX = parseFloat(document.getElementById('zigzagTargetX').value);
    settings.zigzagTargetY = parseFloat(document.getElementById('zigzagTargetY').value);
    settings.pendulumRange = parseFloat(document.getElementById('pendulumRange').value);
    settings.pendulumSpeed = parseFloat(document.getElementById('pendulumSpeed').value);
    settings.waveAmp = parseFloat(document.getElementById('waveAmp').value);
    settings.waveFreq = parseFloat(document.getElementById('waveFreq').value);
    settings.waveTargetX = parseFloat(document.getElementById('waveTargetX').value);
    settings.waveTargetY = parseFloat(document.getElementById('waveTargetY').value);
    settings.bounceHeight = parseFloat(document.getElementById('bounceHeight').value);
    settings.bounceFreq = parseFloat(document.getElementById('bounceFreq').value);
    settings.spiralRadius = parseFloat(document.getElementById('spiralRadius').value);
    settings.spiralRotations = parseFloat(document.getElementById('spiralRotations').value);
    settings.slideDistance = parseFloat(document.getElementById('slideDistance').value);
    settings.rotateCycles = parseFloat(document.getElementById('rotateCycles').value);

    updateControlValues();
}

// Update control value displays
function updateControlValues() {
    document.getElementById('xValue').textContent = document.getElementById('xPos').value;
    document.getElementById('yValue').textContent = document.getElementById('yPos').value;
    document.getElementById('zValue').textContent = document.getElementById('zPos').value;
    document.getElementById('rotXValue').textContent = document.getElementById('rotX').value + '°';
    document.getElementById('rotYValue').textContent = document.getElementById('rotY').value + '°';
    document.getElementById('rotZValue').textContent = document.getElementById('rotZ').value + '°';
    document.getElementById('scaleValue').textContent = document.getElementById('scale').value;
    document.getElementById('alphaValue').textContent = document.getElementById('alpha').value;
    document.getElementById('speedValue').textContent = document.getElementById('animationSpeed').value;
    document.getElementById('durationValue').textContent = document.getElementById('animationDuration').value;

    updateCustomValues();
    updateSpecialEffectValues();
}

// Update special effect value displays
function updateSpecialEffectValues() {
    document.getElementById('swingRangeValue').textContent = document.getElementById('swingRange').value;
    document.getElementById('swingFreqValue').textContent = document.getElementById('swingFreq').value;
    document.getElementById('swingTargetXValue').textContent = document.getElementById('swingTargetX').value;
    document.getElementById('zigzagAmpValue').textContent = document.getElementById('zigzagAmp').value;
    document.getElementById('zigzagFreqValue').textContent = document.getElementById('zigzagFreq').value;
    document.getElementById('zigzagTargetXValue').textContent = document.getElementById('zigzagTargetX').value;
    document.getElementById('zigzagTargetYValue').textContent = document.getElementById('zigzagTargetY').value;
    document.getElementById('pendulumRangeValue').textContent = document.getElementById('pendulumRange').value;
    document.getElementById('pendulumSpeedValue').textContent = document.getElementById('pendulumSpeed').value;
    document.getElementById('waveAmpValue').textContent = document.getElementById('waveAmp').value;
    document.getElementById('waveFreqValue').textContent = document.getElementById('waveFreq').value;
    document.getElementById('waveTargetXValue').textContent = document.getElementById('waveTargetX').value;
    document.getElementById('waveTargetYValue').textContent = document.getElementById('waveTargetY').value;
    document.getElementById('bounceHeightValue').textContent = document.getElementById('bounceHeight').value;
    document.getElementById('bounceFreqValue').textContent = document.getElementById('bounceFreq').value;
    document.getElementById('spiralRadiusValue').textContent = document.getElementById('spiralRadius').value;
    document.getElementById('spiralRotationsValue').textContent = document.getElementById('spiralRotations').value;
    document.getElementById('slideDistanceValue').textContent = document.getElementById('slideDistance').value;
    document.getElementById('rotateCyclesValue').textContent = document.getElementById('rotateCycles').value;
}

// Update custom animation values
function updateCustomValues() {
    document.getElementById('startXValue').textContent = document.getElementById('startX').value;
    document.getElementById('startYValue').textContent = document.getElementById('startY').value;
    document.getElementById('startZValue').textContent = document.getElementById('startZ').value;
    document.getElementById('startScaleValue').textContent = document.getElementById('startScale').value;
    document.getElementById('startOpacityValue').textContent = document.getElementById('startOpacity').value;
    document.getElementById('startRotationValue').textContent = document.getElementById('startRotation').value;

    document.getElementById('endXValue').textContent = document.getElementById('endX').value;
    document.getElementById('endYValue').textContent = document.getElementById('endY').value;
    document.getElementById('endZValue').textContent = document.getElementById('endZ').value;
    document.getElementById('endScaleValue').textContent = document.getElementById('endScale').value;
    document.getElementById('endOpacityValue').textContent = document.getElementById('endOpacity').value;
    document.getElementById('endRotationValue').textContent = document.getElementById('endRotation').value;

    if (selectedLayer) {
        selectedLayer.customAnimation = {
            start: {
                x: parseFloat(document.getElementById('startX').value),
                y: parseFloat(document.getElementById('startY').value),
                z: parseFloat(document.getElementById('startZ').value),
                scale: parseFloat(document.getElementById('startScale').value),
                opacity: parseFloat(document.getElementById('startOpacity').value),
                rotation: parseFloat(document.getElementById('startRotation').value)
            },
            end: {
                x: parseFloat(document.getElementById('endX').value),
                y: parseFloat(document.getElementById('endY').value),
                z: parseFloat(document.getElementById('endZ').value),
                scale: parseFloat(document.getElementById('endScale').value),
                opacity: parseFloat(document.getElementById('endOpacity').value),
                rotation: parseFloat(document.getElementById('endRotation').value)
            }
        };
    }
}

// Update position
function updatePosition() {
    if (!selectedLayer) return;

    const x = parseFloat(document.getElementById('xPos').value);
    const y = parseFloat(document.getElementById('yPos').value);
    const z = parseFloat(document.getElementById('zPos').value);

    selectedLayer.mesh.position.set(x, y, z);
    selectedLayer.originalPosition = { x, y, z };
    updateControlValues();
}

// Update rotation
function updateRotation() {
    if (!selectedLayer) return;

    const x = parseFloat(document.getElementById('rotX').value) * Math.PI / 180;
    const y = parseFloat(document.getElementById('rotY').value) * Math.PI / 180;
    const z = parseFloat(document.getElementById('rotZ').value) * Math.PI / 180;

    selectedLayer.mesh.rotation.set(x, y, z);
    selectedLayer.originalRotation = { x, y, z };
    updateControlValues();
}

// Update transparency
function updateTransparency() {
    if (!selectedLayer) return;

    const alpha = parseFloat(document.getElementById('alpha').value);
    selectedLayer.mesh.material.opacity = alpha;
    selectedLayer.originalOpacity = alpha;
    updateControlValues();
}

// Update scale
function updateScale() {
    if (!selectedLayer) return;

    const scale = parseFloat(document.getElementById('scale').value);
    selectedLayer.mesh.scale.set(scale, scale, scale);
    selectedLayer.originalScale = { x: scale, y: scale, z: scale };
    updateControlValues();
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