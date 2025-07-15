function generateHTMLContent() {
    const name = (document.getElementById('projectName').value || 'AR_Project').trim();

    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name} - AR Experience</title>
    <script src="https://aframe.io/releases/1.4.0/aframe.min.js"><\/script>
    <script src="https://cdn.jsdelivr.net/gh/AR-js-org/AR.js/aframe/build/aframe-ar.js"><\/script>
    <style>
        .ar-controls {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 999;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 10px;
            color: white;
            text-align: center;
        }

        .ar-controls button {
            padding: 10px 20px;
            margin: 5px;
            border: none;
            background: #0066cc;
            color: white;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }

        .ar-controls button:hover {
            background: #0052a3;
        }

        .timeline-info {
            background: rgba(0, 0, 0, 0.9);
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 10px;
            font-size: 12px;
        }
    </style>
</head>

<body>
    <div class="ar-controls">
        <div class="timeline-info">
            <div>Timeline: <span id="timeline-current">0:00</span> / <span id="timeline-duration">0:00</span></div>
            <div style="margin-top: 5px;">
                <button onclick="playTimeline()">Play Timeline</button>
                <button onclick="stopTimeline()">Stop Timeline</button>
                <button onclick="toggleTimelineLoop()">Toggle Loop</button>
            </div>
        </div>
        <button onclick="playAllAnimations()">Play All Animations</button>
        <button onclick="stopAllAnimations()">Stop Animations</button>
    </div>

    <a-scene vr-mode-ui="enabled: false" embedded
        arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3; trackingMethod: best; maxDetectionRate: 60; canvasWidth: 640; canvasHeight: 480;"
        renderer="logarithmicDepthBuffer: true; colorManagement: true; sortObjects: true;"
        background="color: #000000; transparent: true">

        <a-assets>`;

    // Add image assets
    imageLayers.forEach(layer => {
        htmlContent += `
            <img id="img-${layer.id}" src="images/${layer.name}" crossorigin="anonymous">`;
    });

    // Add audio assets if audioTracks exist
    if (typeof audioTracks !== 'undefined' && audioTracks.length > 0) {
        audioTracks.forEach(track => {
            const safeFileName = sanitizeFileName(track.name);
            htmlContent += `
            <audio id="audio-${track.id}" src="audio/${safeFileName}.mp3" preload="auto"></audio>`;
        });
    }

    htmlContent += `
        </a-assets>

        <a-marker type="pattern" url="pattern-${name}-qr-code.patt">`;

    // Add each layer as A-Frame entities with all settings
    imageLayers.forEach(layer => {
        const pos = layer.originalPosition;
        const rot = layer.originalRotation;
        const scale = layer.originalScale;
        const opacity = layer.originalOpacity;

        // Convert rotation from radians to degrees
        const rotX = (rot.x * 180 / Math.PI).toFixed(2);
        const rotY = (rot.y * 180 / Math.PI).toFixed(2);
        const rotZ = (rot.z * 180 / Math.PI).toFixed(2);

        // Properly escape JSON data for HTML attributes
        const customStartJSON = JSON.stringify(layer.customAnimation.start).replace(/"/g, '&quot;');
        const customEndJSON = JSON.stringify(layer.customAnimation.end).replace(/"/g, '&quot;');
        const specialEffectSettingsJSON = JSON.stringify(layer.specialEffectSettings).replace(/"/g, '&quot;');

        // Store original position as data attributes for animation reference
        const originalPosJSON = JSON.stringify(pos).replace(/"/g, '&quot;');
        const originalRotJSON = JSON.stringify(rot).replace(/"/g, '&quot;');
        const originalScaleJSON = JSON.stringify(scale).replace(/"/g, '&quot;');

        htmlContent += `
            <a-plane id="layer-${layer.id}" src="#img-${layer.id}"
                position="${pos.x.toFixed(2)} ${pos.y.toFixed(2)} ${pos.z.toFixed(2)}"
                rotation="${rotX} ${rotY} ${rotZ}"
                scale="${scale.x.toFixed(2)} ${scale.y.toFixed(2)} ${scale.z.toFixed(2)}"
                material="transparent: true; opacity: ${opacity.toFixed(2)}"
                data-animation-enabled="${layer.enableCustomAnimation}" 
                data-special-effect="${layer.specialEffect}"
                data-animation-speed="${layer.animationSpeed}" 
                data-animation-duration="${layer.animationDuration}"
                data-loop-animation="${layer.loopAnimation}"
                data-custom-start="${customStartJSON}"
                data-custom-end="${customEndJSON}"
                data-special-settings="${specialEffectSettingsJSON}"
                data-original-position="${originalPosJSON}"
                data-original-rotation="${originalRotJSON}"
                data-original-scale="${originalScaleJSON}"
                data-original-opacity="${opacity.toFixed(2)}">
            </a-plane>`;
    });

    htmlContent += `
        </a-marker>

        <a-entity camera></a-entity>
    </a-scene>

    <script>
    let animationIntervals = [];
    let audioTracks = [];
    let markerVisible = false;
    
    // Timeline system variables
    let globalTimeline = {
        isPlaying: false,
        startTime: 0,
        currentTime: 0,
        duration: 0,
        loop: true,
        animationId: null
    };

    // Initialize audio tracks from HTML audio elements
    function initializeAudioTracks() {
        audioTracks = [];`;

    // Generate audio track initialization if audioTracks exist
    if (typeof audioTracks !== 'undefined' && audioTracks.length > 0) {
        audioTracks.forEach(track => {
            const safeFileName = sanitizeFileName(track.name);
            htmlContent += `
        audioTracks.push({
            id: "${track.id}",
            name: "${track.name}",
            audio: document.getElementById("audio-${track.id}"),
            playOrder: ${track.playOrder},
            startTime: ${track.startTime},
            endTime: ${track.endTime || track.startTime + (track.duration || 0)},
            duration: ${track.duration || 0},
            timelineActive: false,
            volume: ${track.audio ? track.audio.volume : 0.8},
            isPlaying: false
        });`;
        });
    }

    htmlContent += `
        
        // Set audio properties and calculate timeline duration
        let maxEndTime = 0;
        audioTracks.forEach(track => {
            if (track.audio) {
                track.audio.volume = track.volume;
                track.audio.loop = false;
            }
            if (track.endTime > maxEndTime) {
                maxEndTime = track.endTime;
            }
        });
        
        globalTimeline.duration = maxEndTime;
        updateTimelineDisplay();
        
        console.log('Initialized', audioTracks.length, 'audio tracks');
        console.log('Timeline duration:', globalTimeline.duration, 'seconds');
    }

    // Update timeline display
    function updateTimelineDisplay() {
        const currentSpan = document.getElementById('timeline-current');
        const durationSpan = document.getElementById('timeline-duration');
        
        if (currentSpan) {
            const minutes = Math.floor(globalTimeline.currentTime / 60);
            const seconds = Math.floor(globalTimeline.currentTime % 60);
            currentSpan.textContent = minutes + ':' + seconds.toString().padStart(2, '0');
        }
        
        if (durationSpan) {
            const minutes = Math.floor(globalTimeline.duration / 60);
            const seconds = Math.floor(globalTimeline.duration % 60);
            durationSpan.textContent = minutes + ':' + seconds.toString().padStart(2, '0');
        }
    }

    // Play timeline (Adobe AE style)
    function playTimeline() {
        if (globalTimeline.isPlaying) {
            stopTimeline();
            return;
        }
        
        globalTimeline.isPlaying = true;
        globalTimeline.startTime = Date.now();
        globalTimeline.currentTime = 0;
        
        console.log('Starting timeline playback (Duration: ' + globalTimeline.duration + 's, Loop: ' + globalTimeline.loop + ')');
        
        // Start timeline loop
        updateTimeline();
    }

    // Stop timeline
    function stopTimeline() {
        globalTimeline.isPlaying = false;
        globalTimeline.currentTime = 0;
        
        if (globalTimeline.animationId) {
            cancelAnimationFrame(globalTimeline.animationId);
            globalTimeline.animationId = null;
        }
        
        // Stop all tracks
        audioTracks.forEach(track => {
            if (track.audio) {
                track.audio.pause();
                track.audio.currentTime = 0;
            }
            track.timelineActive = false;
        });
        
        updateTimelineDisplay();
        console.log('Timeline stopped and reset');
    }

    // Toggle timeline loop
    function toggleTimelineLoop() {
        globalTimeline.loop = !globalTimeline.loop;
        console.log('Timeline loop:', globalTimeline.loop ? 'enabled' : 'disabled');
    }

    // Update timeline (main timeline loop)
    function updateTimeline() {
        if (!globalTimeline.isPlaying) return;
        
        // Calculate current timeline position
        const elapsed = (Date.now() - globalTimeline.startTime) / 1000;
        globalTimeline.currentTime = elapsed;
        
        updateTimelineDisplay();
        
        // Check if timeline is complete
        if (elapsed >= globalTimeline.duration) {
            if (globalTimeline.loop) {
                // Restart timeline
                console.log('Timeline loop - restarting');
                globalTimeline.startTime = Date.now();
                globalTimeline.currentTime = 0;
                
                // Reset all tracks
                audioTracks.forEach(track => {
                    if (track.audio) {
                        track.audio.pause();
                        track.audio.currentTime = 0;
                    }
                    track.timelineActive = false;
                });
            } else {
                // Stop timeline
                stopTimeline();
                return;
            }
        }
        
        // Update each track based on timeline position
        audioTracks.forEach(track => {
            if (!track.audio) return;
            
            const shouldPlay = elapsed >= track.startTime && elapsed < track.endTime;
            
            if (shouldPlay && !track.timelineActive) {
                // Start playing this track
                track.timelineActive = true;
                track.audio.currentTime = 0;
                track.audio.play().catch(e => console.log('Audio play failed:', e));
                
                console.log('Timeline: Starting ' + track.name + ' at ' + elapsed.toFixed(1) + 's');
                
            } else if (!shouldPlay && track.timelineActive) {
                // Stop playing this track
                track.timelineActive = false;
                track.audio.pause();
                track.audio.currentTime = 0;
                
                console.log('Timeline: Stopping ' + track.name + ' at ' + elapsed.toFixed(1) + 's');
            }
        });
        
        // Continue timeline
        globalTimeline.animationId = requestAnimationFrame(updateTimeline);
    }

    // Call initialization when page loads
    window.addEventListener('load', initializeAudioTracks);

    // Marker event handlers
    document.querySelector('a-marker').addEventListener('markerFound', function() {
        markerVisible = true;
        console.log('Marker found - starting timeline and animations');
        
        // Auto-start timeline when marker is found
        playTimeline();
        playAllAnimations();
    });

    document.querySelector('a-marker').addEventListener('markerLost', function() {
        markerVisible = false;
        console.log('Marker lost - stopping timeline and animations');
        
        // Stop timeline and animations
        stopTimeline();
        stopAllAnimations();
    });

    // Animation functions (unchanged)
    function playAllAnimations() {
        stopAllAnimations();
        const layers = document.querySelectorAll('[id^="layer-"]');
        layers.forEach(layer => {
            const enableCustom = layer.getAttribute('data-animation-enabled') === 'true';
            const specialEffect = layer.getAttribute('data-special-effect');
            
            if (enableCustom || specialEffect !== 'none') {
                const speed = parseFloat(layer.getAttribute('data-animation-speed'));
                const duration = parseFloat(layer.getAttribute('data-animation-duration'));
                const loop = layer.getAttribute('data-loop-animation') === 'true';
                
                // Parse special effect settings
                let settings = {};
                try {
                    settings = JSON.parse(layer.getAttribute('data-special-settings').replace(/&quot;/g, '"'));
                } catch (e) {
                    console.error('Error parsing special effect settings:', e);
                    // Fallback to default settings
                    settings = {
                        swingRange: 90, swingFreq: 8, swingTargetX: 5,
                        zigzagAmp: 2, zigzagFreq: 6, zigzagTargetX: 5, zigzagTargetY: 3,
                        pendulumRange: 60, pendulumSpeed: 2,
                        waveAmp: 1.5, waveFreq: 4, waveTargetX: 4, waveTargetY: 2,
                        bounceHeight: 2, bounceFreq: 4,
                        spiralRadius: 3, spiralRotations: 6,
                        slideDistance: 10, rotateCycles: 1
                    };
                }
                
                const startTime = Date.now();
                
                const interval = setInterval(() => {
                    const currentTime = Date.now();
                    const elapsed = (currentTime - startTime) / 1000 * speed;
                    let progress = (elapsed % duration) / duration;
                    
                    if (!loop && elapsed > duration) {
                        clearInterval(interval);
                        return;
                    }
                    
                    const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                    const easedProgress = easeInOut(progress);

                    // Get original values
                    const originalPosStr = layer.getAttribute('data-original-position').replace(/&quot;/g, '"');
                    const originalPos = JSON.parse(originalPosStr);
                    const origX = originalPos.x, origY = originalPos.y, origZ = originalPos.z;
                    
                    const originalRotStr = layer.getAttribute('data-original-rotation').replace(/&quot;/g, '"');
                    const originalRot = JSON.parse(originalRotStr);
                    const origRotX = originalRot.x * 180 / Math.PI;
                    const origRotY = originalRot.y * 180 / Math.PI;
                    const origRotZ = originalRot.z * 180 / Math.PI;
                    
                    const originalScaleStr = layer.getAttribute('data-original-scale').replace(/&quot;/g, '"');
                    const originalScale = JSON.parse(originalScaleStr);
                    const origScaleX = originalScale.x, origScaleY = originalScale.y, origScaleZ = originalScale.z;

                    let finalX = origX, finalY = origY, finalZ = origZ;
                    let finalRotX = origRotX, finalRotY = origRotY, finalRotZ = origRotZ;
                    let finalScaleX = origScaleX, finalScaleY = origScaleY, finalScaleZ = origScaleZ;
                    let finalOpacity = parseFloat(layer.getAttribute('data-original-opacity'));
                
                    // Apply custom animation if enabled
                    if (enableCustom) {
                        try {
                            const customStart = JSON.parse(layer.getAttribute('data-custom-start').replace(/&quot;/g, '"'));
                            const customEnd = JSON.parse(layer.getAttribute('data-custom-end').replace(/&quot;/g, '"'));
                            
                            finalX = customStart.x + (customEnd.x - customStart.x) * easedProgress;
                            finalY = customStart.y + (customEnd.y - customStart.y) * easedProgress;
                            finalZ = customStart.z + (customEnd.z - customStart.z) * easedProgress;
                            
                            const customScale = customStart.scale + (customEnd.scale - customStart.scale) * easedProgress;
                            finalScaleX = finalScaleY = finalScaleZ = customScale;
                            
                            finalOpacity = customStart.opacity + (customEnd.opacity - customStart.opacity) * easedProgress;
                            finalRotZ = origRotZ + (customStart.rotation + (customEnd.rotation - customStart.rotation) * easedProgress);
                        } catch (e) {
                            console.error('Error parsing custom animation data:', e);
                        }
                    }
                    
                    // Apply special effects (same as original)
                    if (specialEffect !== 'none') {
                        switch (specialEffect) {
                            case 'swingToTarget':
                                const swingAmplitude = (1 - easedProgress) * settings.swingRange;
                                const swingAngle = Math.sin(progress * settings.swingFreq * Math.PI) * swingAmplitude;
                                finalRotZ += swingAngle;
                                if (!enableCustom) {
                                    finalX += settings.swingTargetX * easedProgress;
                                }
                                break;

                            case 'zigzagToTarget':
                                const zigzagAmplitude = (1 - easedProgress) * settings.zigzagAmp;
                                const zigzagOffset = Math.sin(progress * settings.zigzagFreq * Math.PI) * zigzagAmplitude;
                                finalX += zigzagOffset;
                                if (!enableCustom) {
                                    finalX += settings.zigzagTargetX * easedProgress;
                                    finalY += settings.zigzagTargetY * easedProgress;
                                }
                                break;

                            case 'pendulumMove':
                                const pendulumAngle = Math.sin(elapsed * settings.pendulumSpeed) * settings.pendulumRange;
                                finalRotZ += pendulumAngle;
                                break;

                            case 'waveToTarget':
                                const waveY = Math.sin(progress * settings.waveFreq * Math.PI) * settings.waveAmp * (1 - easedProgress);
                                finalY += waveY;
                                finalRotZ += (waveY * 0.2);
                                if (!enableCustom) {
                                    finalX += settings.waveTargetX * easedProgress;
                                    finalY += settings.waveTargetY * easedProgress;
                                }
                                break;

                            case 'elasticMove':
                                const scaleElastic = 1 + Math.sin(progress * 10) * 0.1 * (1 - progress);
                                finalScaleX *= scaleElastic;
                                finalScaleY *= scaleElastic;
                                finalScaleZ *= scaleElastic;
                                if (!enableCustom) {
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
                                finalRotZ += easedProgress * 360 * settings.rotateCycles;
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
                    
                    // Update layer position, rotation, and scale
                    layer.setAttribute('position', finalX + ' ' + finalY + ' ' + finalZ);
                    layer.setAttribute('rotation', finalRotX + ' ' + finalRotY + ' ' + finalRotZ);
                    layer.setAttribute('scale', finalScaleX + ' ' + finalScaleY + ' ' + finalScaleZ);
                    layer.setAttribute('material', 'transparent: true; opacity: ' + finalOpacity);
                    
                }, 16); // ~60fps
                
                animationIntervals.push(interval);
            }
        });
    }
    
    function stopAllAnimations() {
        animationIntervals.forEach(interval => clearInterval(interval));
        animationIntervals = [];
        
        // Reset all layers to original state
        const layers = document.querySelectorAll('[id^="layer-"]');
        layers.forEach(layer => {
            try {
                const originalPos = JSON.parse(layer.getAttribute('data-original-position').replace(/&quot;/g, '"'));
                const originalRot = JSON.parse(layer.getAttribute('data-original-rotation').replace(/&quot;/g, '"'));
                const originalScale = JSON.parse(layer.getAttribute('data-original-scale').replace(/&quot;/g, '"'));
                const originalOpacity = parseFloat(layer.getAttribute('data-original-opacity'));
                
                layer.setAttribute('position', originalPos.x + ' ' + originalPos.y + ' ' + originalPos.z);
                layer.setAttribute('rotation', (originalRot.x * 180 / Math.PI) + ' ' + (originalRot.y * 180 / Math.PI) + ' ' + (originalRot.z * 180 / Math.PI));
                layer.setAttribute('scale', originalScale.x + ' ' + originalScale.y + ' ' + originalScale.z);
                layer.setAttribute('material', 'transparent: true; opacity: ' + originalOpacity);
            } catch (e) {
                console.error('Error resetting layer:', e);
            }
        });
    }
    
    <\/script>
</body>
</html>`;

    return htmlContent;
}