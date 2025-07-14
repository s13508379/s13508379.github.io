// Apply animation
function applyAnimation() {
    if (!selectedLayer) return;

    // Save current settings to the layer
    saveCurrentLayerSettings();
    updateSpecialEffectSettings();

    if (selectedLayer.animation) {
        selectedLayer.animation.stop();
    }

    selectedLayer.animation = createAnimationForLayer(selectedLayer);
}

// Preview animation (single run)
function previewAnimation() {
    if (!selectedLayer) return;

    // Save current loop setting and temporarily disable it
    const originalLoop = selectedLayer.loopAnimation;
    selectedLayer.loopAnimation = false;

    applyAnimation();

    // Restore original loop setting after animation completes
    setTimeout(() => {
        selectedLayer.loopAnimation = originalLoop;
    }, selectedLayer.animationDuration * 1000);
}

// Stop animation for selected layer
function stopAnimation() {
    if (!selectedLayer || !selectedLayer.animation) return;
    selectedLayer.animation.stop();
}

// Play all animations - now uses each layer's individual settings
function playAllAnimations() {
    imageLayers.forEach(layer => {
        if (layer.enableCustomAnimation || layer.specialEffect !== 'none') {
            // Stop any existing animation for this layer
            if (layer.animation) {
                layer.animation.stop();
            }

            // Create and start new animation using the layer's own settings
            layer.animation = createAnimationForLayer(layer);
        }
    });
}

// Stop all animations
function stopAllAnimations() {
    imageLayers.forEach(layer => {
        if (layer.animation) {
            layer.animation.stop();
        }
    });
}

// Reset camera
function resetCamera() {
    camera.position.set(0, 4, 0);
    camera.lookAt(0, 0, 0);
}