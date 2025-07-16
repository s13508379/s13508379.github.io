function generateHTMLContent() {
    const name = (document.getElementById('projectName').value || 'AR_Project').trim();
    console.log('🚀 Starting HTML generation for project:', name);

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

        /* Add debug console styles */
        .debug-console {
            position: fixed;
            top: 10px;
            right: 10px;
            width: 300px;
            max-height: 400px;
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            border-radius: 5px;
            overflow-y: auto;
            z-index: 1000;
            border: 1px solid #333;
        }

        .debug-console .log-entry {
            margin: 2px 0;
            padding: 2px 0;
            border-bottom: 1px solid #333;
        }

        .debug-console .log-error {
            color: #ff4444;
        }

        .debug-console .log-warning {
            color: #ffaa00;
        }

        .debug-console .log-info {
            color: #00aaff;
        }

        .debug-console .log-success {
            color: #00ff00;
        }

        .debug-toggle {
            position: fixed;
            top: 10px;
            right: 320px;
            background: #333;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            z-index: 1001;
        }
    </style>
</head>

<body>
    <button class="debug-toggle" onclick="toggleDebugConsole()">Toggle Debug</button>
    <div class="debug-console" id="debugConsole">
        <div class="log-entry log-info">🔧 Debug Console Initialized</div>
    </div>

    <div class="ar-controls">
        <div class="timeline-info">
            <span id="timeline-current">0:00</span> / <span id="timeline-duration">0:00</span>
        </div>
        <button onclick="playAllAnimations()">Play All Animations</button>
        <button onclick="stopAllAnimations()">Stop Animations</button>
        <button onclick="playTimeline()">Play Timeline</button>
        <button onclick="stopTimeline()">Stop Timeline</button>
        <button onclick="toggleTimelineLoop()">Toggle Loop</button>
        <button onclick="clearDebugLog()">Clear Log</button>
    </div>

    <a-scene vr-mode-ui="enabled: false" embedded
        arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3; trackingMethod: best; maxDetectionRate: 60; canvasWidth: 640; canvasHeight: 480;"
        renderer="logarithmicDepthBuffer: true; colorManagement: true; sortObjects: true;"
        background="color: #000000; transparent: true">

        <a-assets>`;

    // Add image assets with logging
    console.log('📸 Adding image assets...');
    if (typeof imageLayers !== 'undefined') {
        console.log('Found', imageLayers.length, 'image layers');
        imageLayers.forEach((layer, index) => {
            console.log(`  Layer ${index + 1}: ${layer.name} (ID: ${layer.id})`);
            htmlContent += `
            <img id="img-${layer.id}" src="images/${layer.name}" crossorigin="anonymous">`;
        });
    } else {
        console.warn('⚠️ imageLayers is undefined!');
    }

    // Add audio assets if audioTracks exist with logging
    console.log('🎵 Adding audio assets...');
    if (typeof audioTracks !== 'undefined' && audioTracks.length > 0) {
        console.log('Found', audioTracks.length, 'audio tracks');
        audioTracks.forEach((track, index) => {
            const safeFileName = sanitizeFileName(track.name);
            console.log(`  Track ${index + 1}: ${track.name} -> ${safeFileName}.mp3 (ID: ${track.id})`);
            htmlContent += `
            <audio id="audio-${track.id}" src="audio/${safeFileName}.mp3" preload="auto"></audio>`;
        });
    } else {
        console.log('ℹ️ No audio tracks found or audioTracks is undefined');
    }

    htmlContent += `
        </a-assets>

        <a-marker type="pattern" url="pattern-${name}-qr-code.patt">`;

    // Add each layer as A-Frame entities with all settings and logging
    console.log('🎭 Adding layer entities...');
    if (typeof imageLayers !== 'undefined') {
        imageLayers.forEach((layer, index) => {
            console.log(`  Processing layer ${index + 1}:`, layer.name);
            
            const pos = layer.originalPosition;
            const rot = layer.originalRotation;
            const scale = layer.originalScale;
            const opacity = layer.originalOpacity;

            // Convert rotation from radians to degrees
            const rotX = (rot.x * 180 / Math.PI).toFixed(2);
            const rotY = (rot.y * 180 / Math.PI).toFixed(2);
            const rotZ = (rot.z * 180 / Math.PI).toFixed(2);

            console.log(`    Position: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
            console.log(`    Rotation: (${rotX}°, ${rotY}°, ${rotZ}°)`);
            console.log(`    Scale: (${scale.x.toFixed(2)}, ${scale.y.toFixed(2)}, ${scale.z.toFixed(2)})`);
            console.log(`    Opacity: ${opacity.toFixed(2)}`);

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
    }

    htmlContent += `
        </a-marker>

        <a-entity camera></a-entity>
    </a-scene>

    <script>
    // Enhanced logging system
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
    };

    let debugConsoleVisible = true;
    let debugEntries = [];

    function debugLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const entry = {
            timestamp,
            message,
            type
        };
        
        debugEntries.push(entry);
        
        // Keep only last 100 entries
        if (debugEntries.length > 100) {
            debugEntries.shift();
        }
        
        // Also log to browser console
        originalConsole[type]('[' + timestamp + '] ' + message);
        
        updateDebugConsole();
    }

    function updateDebugConsole() {
        const console = document.getElementById('debugConsole');
        if (!console) return;
        
        console.innerHTML = debugEntries.map(entry => 
            '<div class="log-entry log-' + entry.type + '">[' + entry.timestamp + '] ' + entry.message + '</div>'
        ).join('');
        
        // Auto-scroll to bottom
        console.scrollTop = console.scrollHeight;
    }

    function toggleDebugConsole() {
        const console = document.getElementById('debugConsole');
        debugConsoleVisible = !debugConsoleVisible;
        console.style.display = debugConsoleVisible ? 'block' : 'none';
        debugLog('Debug console ' + (debugConsoleVisible ? 'shown' : 'hidden'), 'info');
    }

    function clearDebugLog() {
        debugEntries = [];
        updateDebugConsole();
        debugLog('Debug log cleared', 'info');
    }

    // Override console methods to capture all logs
    console.log = (message) => debugLog(message, 'info');
    console.error = (message) => debugLog(message, 'error');
    console.warn = (message) => debugLog(message, 'warning');
    console.info = (message) => debugLog(message, 'info');

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

    debugLog('🚀 AR Application Starting Up', 'success');
    debugLog('Timeline initialized with loop: ' + globalTimeline.loop, 'info');

    // Initialize audio tracks from HTML audio elements
    function initializeAudioTracks() {
        debugLog('🎵 Initializing audio tracks...', 'info');
        audioTracks = [];`;

    // Generate audio track initialization if audioTracks exist
    if (typeof audioTracks !== 'undefined' && audioTracks.length > 0) {
        audioTracks.forEach(track => {
            const safeFileName = sanitizeFileName(track.name);
            htmlContent += `
        try {
            const audioElement = document.getElementById("audio-${track.id}");
            if (audioElement) {
                audioTracks.push({
                    id: "${track.id}",
                    name: "${track.name}",
                    audio: audioElement,
                    playOrder: ${track.playOrder},
                    startTime: ${track.startTime},
                    endTime: ${track.endTime || track.startTime + (track.duration || 0)},
                    duration: ${track.duration || 0},
                    timelineActive: false,
                    volume: ${track.audio ? track.audio.volume : 0.8},
                    isPlaying: false
                });
                debugLog('✅ Audio track loaded: ${track.name}', 'success');
            } else {
                debugLog('❌ Audio element not found: audio-${track.id}', 'error');
            }
        } catch (error) {
            debugLog('❌ Error loading audio track ${track.name}: ' + error.message, 'error');
        }`;
        });
    }

    htmlContent += `
        
        // Set audio properties and calculate timeline duration
        let maxEndTime = 0;
        audioTracks.forEach(track => {
            if (track.audio) {
                track.audio.volume = track.volume;
                track.audio.loop = false;
                
                // Add event listeners for debugging
                track.audio.addEventListener('loadstart', () => {
                    debugLog('📥 Loading started: ' + track.name, 'info');
                });
                
                track.audio.addEventListener('canplaythrough', () => {
                    debugLog('✅ Can play through: ' + track.name, 'success');
                });
                
                track.audio.addEventListener('error', (e) => {
                    debugLog('❌ Audio error for ' + track.name + ': ' + e.message, 'error');
                });
                
                track.audio.addEventListener('ended', () => {
                    debugLog('🏁 Audio ended: ' + track.name, 'info');
                    track.timelineActive = false;
                });
            }
            
            if (track.endTime > maxEndTime) {
                maxEndTime = track.endTime;
            }
        });
        
        globalTimeline.duration = maxEndTime;
        updateTimelineDisplay();
        
        debugLog('🎵 Initialized ' + audioTracks.length + ' audio tracks', 'success');
        debugLog('📏 Timeline duration: ' + globalTimeline.duration + ' seconds', 'info');
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
            debugLog('⏸️ Timeline already playing, stopping...', 'info');
            stopTimeline();
            return;
        }
        
        globalTimeline.isPlaying = true;
        globalTimeline.startTime = Date.now();
        globalTimeline.currentTime = 0;
        
        debugLog('▶️ Starting timeline playback (Duration: ' + globalTimeline.duration + 's, Loop: ' + globalTimeline.loop + ')', 'success');
        
        // Start timeline loop
        updateTimeline();
    }

    // Stop timeline
    function stopTimeline() {
        if (!globalTimeline.isPlaying) {
            debugLog('⏹️ Timeline already stopped', 'info');
            return;
        }
        
        globalTimeline.isPlaying = false;
        globalTimeline.currentTime = 0;
        
        if (globalTimeline.animationId) {
            cancelAnimationFrame(globalTimeline.animationId);
            globalTimeline.animationId = null;
        }
        
        // Stop all tracks
        let stoppedTracks = 0;
        audioTracks.forEach(track => {
            if (track.audio && track.timelineActive) {
                track.audio.pause();
                track.audio.currentTime = 0;
                stoppedTracks++;
            }
            track.timelineActive = false;
        });
        
        updateTimelineDisplay();
        debugLog('⏹️ Timeline stopped and reset (' + stoppedTracks + ' tracks stopped)', 'info');
    }

    // Toggle timeline loop
    function toggleTimelineLoop() {
        globalTimeline.loop = !globalTimeline.loop;
        debugLog('🔄 Timeline loop: ' + (globalTimeline.loop ? 'enabled' : 'disabled'), 'info');
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
                debugLog('🔄 Timeline loop - restarting', 'info');
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
                debugLog('🏁 Timeline completed', 'success');
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
                track.audio.play().then(() => {
                    debugLog('▶️ Timeline: Playing ' + track.name + ' at ' + elapsed.toFixed(1) + 's', 'success');
                }).catch(e => {
                    debugLog('❌ Timeline: Failed to play ' + track.name + ': ' + e.message, 'error');
                });
                
            } else if (!shouldPlay && track.timelineActive) {
                // Stop playing this track
                track.timelineActive = false;
                track.audio.pause();
                track.audio.currentTime = 0;
                
                debugLog('⏸️ Timeline: Stopping ' + track.name + ' at ' + elapsed.toFixed(1) + 's', 'info');
            }
        });
        
        // Continue timeline
        globalTimeline.animationId = requestAnimationFrame(updateTimeline);
    }

    // Call initialization when page loads
    window.addEventListener('load', () => {
        debugLog('📄 Page loaded, initializing...', 'info');
        initializeAudioTracks();
    });

    // Marker event handlers
    document.querySelector('a-marker').addEventListener('markerFound', function() {
        markerVisible = true;
        debugLog('📍 Marker found - starting timeline and animations', 'success');
        
        // Auto-start timeline when marker is found
        playTimeline();
        playAllAnimations();
    });

    document.querySelector('a-marker').addEventListener('markerLost', function() {
        markerVisible = false;
        debugLog('❌ Marker lost - stopping timeline and animations', 'warning');
        
        // Stop timeline and animations
        stopTimeline();
        stopAllAnimations();
    });

    // Animation functions with enhanced logging
    function playAllAnimations() {
        debugLog('🎬 Starting all animations...', 'info');
        stopAllAnimations();
        
        const layers = document.querySelectorAll('[id^="layer-"]');
        debugLog('Found ' + layers.length + ' layers to animate', 'info');
        
        layers.forEach((layer, index) => {
            const layerId = layer.id;
            const enableCustom = layer.getAttribute('data-animation-enabled') === 'true';
            const specialEffect = layer.getAttribute('data-special-effect');
            
            debugLog('Layer ' + (index + 1) + ' (' + layerId + '): Custom=' + enableCustom + ', Effect=' + specialEffect, 'info');
            
            if (enableCustom || specialEffect !== 'none') {
                const speed = parseFloat(layer.getAttribute('data-animation-speed'));
                const duration = parseFloat(layer.getAttribute('data-animation-duration'));
                const loop = layer.getAttribute('data-loop-animation') === 'true';
                
                debugLog('Animation settings: Speed=' + speed + ', Duration=' + duration + ', Loop=' + loop, 'info');
                
                // Parse special effect settings
                let settings = {};
                try {
                    settings = JSON.parse(layer.getAttribute('data-special-settings').replace(/&quot;/g, '"'));
                    debugLog('Special effect settings loaded for ' + layerId, 'info');
                } catch (e) {
                    debugLog('❌ Error parsing special effect settings for ' + layerId + ': ' + e.message, 'error');
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
                        debugLog('🏁 Animation completed for ' + layerId, 'info');
                        clearInterval(interval);
                        return;
                    }
                    
                    const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                    const easedProgress = easeInOut(progress);

                    // Get original values
                    try {
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
                                debugLog('❌ Error parsing custom animation data for ' + layerId + ': ' + e.message, 'error');
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
                                default:
                                    debugLog('⚠️ Unknown special effect: ' + specialEffect, 'warning');
                                    break;
                            }
                        }
                        
                        // Update layer position, rotation, and scale
                        layer.setAttribute('position', finalX + ' ' + finalY + ' ' + finalZ);
                        layer.setAttribute('rotation', finalRotX + ' ' + finalRotY + ' ' + finalRotZ);
                        layer.setAttribute('scale', finalScaleX + ' ' + finalScaleY + ' ' + finalScaleZ);
                        layer.setAttribute('material', 'transparent: true; opacity: ' + finalOpacity);
                        
                    } catch (e) {
                        debugLog('❌ Animation error for ' + layerId + ': ' + e.message, 'error');
                        clearInterval(interval);
                    }
                    
                }, 16); // ~60fps
                
                animationIntervals.push(interval);
                debugLog('✅ Animation started for ' + layerId, 'success');
            } else {
                debugLog('⏭️ No animation for ' + layerId + ' (disabled)', 'info');
            }
        });
        
        debugLog('🎬 All animations started (' + animationIntervals.length + ' active)', 'success');
    }
    
    function stopAllAnimations() {
        debugLog('⏹️ Stopping all animations...', 'info');
        
        const stoppedCount = animationIntervals.length;
        animationIntervals.forEach(interval => clearInterval(interval));
        animationIntervals = [];
        
        // Reset all layers to original state
        const layers = document.querySelectorAll('[id^="layer-"]');
        let resetCount = 0;
        
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
                
                resetCount++;
            } catch (e) {
                debugLog('❌ Error resetting layer ' + layer.id + ': ' + e.message, 'error');
            }
        });
        
        debugLog('⏹️ Stopped ' + stoppedCount + ' animations and reset ' + resetCount + ' layers', 'info');
    }

    // A-Frame scene initialization logging
    document.addEventListener('DOMContentLoaded', function() {
        debugLog('📄 DOM Content Loaded', 'info');
        
        // Wait for A-Frame to initialize
        setTimeout(() => {
            const scene = document.querySelector('a-scene');
            if (scene) {
                debugLog('🎬 A-Frame scene found', 'success');
                
                scene.addEventListener('loaded', () => {
                    debugLog('✅ A-Frame scene loaded', 'success');
                });
                
                scene.addEventListener('renderstart', () => {
                    debugLog('🎨 A-Frame rendering started', 'success');
                });
                
                // Check for AR.js
                if (typeof AFRAME !== 'undefined' && AFRAME.components && AFRAME.components.arjs) {
                    debugLog('📱 AR.js component detected', 'success');
                } else {
                    debugLog('⚠️ AR.js component not found', 'warning');
                }
                
                // Monitor camera
                const camera = document.querySelector('[camera]');
                if (camera) {
                    debugLog('📷 Camera entity found', 'success');
                } else {
                    debugLog('❌ Camera entity not found', 'error');
                }
                
                // Monitor marker
                const marker = document.querySelector('a-marker');
                if (marker) {
                    debugLog('🎯 Marker entity found', 'success');
                } else {
                    debugLog('❌ Marker entity not found', 'error');
                }
                
            } else {
                debugLog('❌ A-Frame scene not found', 'error');
            }
        }, 1000);
    });

    // Add error handling for the entire application
    window.addEventListener('error', function(event) {
        debugLog('💥 Global error: ' + event.message + ' at ' + event.filename + ':' + event.lineno, 'error');
    });

    window.addEventListener('unhandledrejection', function(event) {
        debugLog('💥 Unhandled promise rejection: ' + event.reason, 'error');
    });

    // Monitor performance
    function logPerformance() {
        if (performance && performance.memory) {
            const memory = performance.memory;
            debugLog('📊 Memory: Used=' + Math.round(memory.usedJSHeapSize / 1048576) + 'MB, Total=' + Math.round(memory.totalJSHeapSize / 1048576) + 'MB', 'info');
        }
    }

    // Log performance every 30 seconds
    setInterval(logPerformance, 30000);

    // Initial performance log
    setTimeout(logPerformance, 5000);

    debugLog('🎉 AR Application fully initialized', 'success');
    
    <\/script>
</body>
</html>`;

    console.log('✅ HTML content generation completed successfully');
    console.log('📄 Total HTML length:', htmlContent.length, 'characters');
    
    return htmlContent;
}