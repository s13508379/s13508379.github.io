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


    </style>
</head>

<body>
    <div class="ar-controls">
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
    let backgroundAudioTrack = null;
    let currentSequentialIndex = 0;
    let sequentialAudioInterval = null;

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
            loop: ${track.loop},
            isBackground: ${track.isBackground},
            startTime: ${track.startTime},
            endTime: ${track.endTime || 'null'},
            timelineMode: ${track.timelineMode},
            volume: ${track.audio.volume},
            isPlaying: false
        });`;
        });
    }

    htmlContent += `
        
        // Set audio properties
        audioTracks.forEach(track => {
            track.audio.volume = track.volume;
            if (track.isBackground) {
                track.audio.loop = true;
                backgroundAudioTrack = track;
            }
        });
        
        console.log('Initialized', audioTracks.length, 'audio tracks');
    }

    // Call initialization when page loads
    window.addEventListener('load', initializeAudioTracks);

    document.querySelector('a-marker').addEventListener('markerFound', function() {
        markerVisible = true;
        console.log('Marker found - starting animations and audio');
        
        // Start background audio if exists
        if (backgroundAudioTrack && backgroundAudioTrack.audio) {
            backgroundAudioTrack.audio.play().catch(e => console.log('Background audio autoplay blocked:', e));
        }
        
        // Auto-start sequential audio playback based on settings
        playSequentialAudio();
        playAllAnimations();
    });

    document.querySelector('a-marker').addEventListener('markerLost', function() {
        markerVisible = false;
        console.log('Marker lost - stopping animations and audio');
        
        // Stop all audio
        stopAllAudio();
        stopAllAnimations();
    });

    function playSequentialAudio() {
        if (audioTracks.length === 0) {
            console.log('No audio tracks available');
            return;
        }

        stopAllAudio();
        
        const regularTracks = audioTracks
            .filter(track => !track.isBackground)
            .sort((a, b) => a.playOrder - b.playOrder);

        if (regularTracks.length === 0) {
            console.log('No regular tracks to play');
            return;
        }

        currentSequentialIndex = 0;
        playNextInSequence(regularTracks);
    }

    function playNextInSequence(tracks) {
        if (currentSequentialIndex >= tracks.length) {
            console.log('Sequential playback complete');
            return;
        }

        const track = tracks[currentSequentialIndex];
        console.log('Playing track:', track.name);

        // Set start time if timeline mode
        if (track.timelineMode && track.startTime > 0) {
            track.audio.currentTime = track.startTime;
        }

        track.audio.play().catch(e => console.log('Audio play error:', e));
        track.isPlaying = true;

        // Set up end listener
        const onEnded = () => {
            track.audio.removeEventListener('ended', onEnded);
            track.audio.removeEventListener('timeupdate', onTimeUpdate);
            track.isPlaying = false;
            currentSequentialIndex++;
            
            setTimeout(() => {
                playNextInSequence(tracks);
            }, 100);
        };

        const onTimeUpdate = () => {
            if (track.timelineMode && track.endTime && track.audio.currentTime >= track.endTime) {
                track.audio.pause();
                onEnded();
            }
        };

        track.audio.addEventListener('ended', onEnded);
        if (track.timelineMode && track.endTime) {
            track.audio.addEventListener('timeupdate', onTimeUpdate);
        }
    }

    function stopAllAudio() {
        if (sequentialAudioInterval) {
            clearInterval(sequentialAudioInterval);
            sequentialAudioInterval = null;
        }

        audioTracks.forEach(track => {
            track.audio.pause();
            track.isPlaying = false;
            
            if (track.timelineMode && track.startTime > 0) {
                track.audio.currentTime = track.startTime;
            } else {
                track.audio.currentTime = 0;
            }
        });

        currentSequentialIndex = 0;
        console.log('All audio stopped');
    }

    function toggleBackgroundAudio() {
        if (!backgroundAudioTrack) {
            console.log('No background audio track available');
            return;
        }

        if (backgroundAudioTrack.isPlaying) {
            backgroundAudioTrack.audio.pause();
            backgroundAudioTrack.isPlaying = false;
            console.log('Background audio paused');
        } else {
            backgroundAudioTrack.audio.play().catch(e => console.log('Background audio play error:', e));
            backgroundAudioTrack.isPlaying = true;
            console.log('Background audio playing');
        }
    }

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

                    const originalPos = layer.getAttribute('position');
                    const originalRot = layer.getAttribute('rotation');
                    const originalScale = layer.getAttribute('scale');
                    const origX = originalPos.x, origY = originalPos.y, origZ = originalPos.z;
                    const origRotX = originalRot.x, origRotY = originalRot.y, origRotZ = originalRot.z;
                    const origScaleX = originalScale.x, origScaleY = originalScale.y, origScaleZ = originalScale.z;

                    let finalX = origX, finalY = origY, finalZ = origZ;
                    let finalRotX = origRotX, finalRotY = origRotY, finalRotZ = origRotZ;
                    let finalScaleX = origScaleX, finalScaleY = origScaleY, finalScaleZ = origScaleZ;
                    let finalOpacity = 1;
                
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
                            finalRotZ = customStart.rotation + (customEnd.rotation - customStart.rotation) * easedProgress;
                        } catch (e) {
                            console.error('Error parsing custom animation data:', e);
                        }
                    }
                    
                    // Apply special effects with user-controlled settings
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
                    
                    // Update opacity if needed
                    if (specialEffect === 'fadeIn' || enableCustom) {
                        layer.setAttribute('material', 'transparent: true; opacity: ' + finalOpacity);
                    }
                    
                }, 16); // ~60fps
                
                animationIntervals.push(interval);
            }
        });
    }
    
    function stopAllAnimations() {
        animationIntervals.forEach(interval => clearInterval(interval));
        animationIntervals = [];
    }
    
    <\/script>
</body>
</html>`;

    return htmlContent;
}