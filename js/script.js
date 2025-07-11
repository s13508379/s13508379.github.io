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

// Add mouse controls for camera
function addMouseControls() {
    let mouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    renderer.domElement.addEventListener('mousedown', (event) => {
        mouseDown = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
    });

    renderer.domElement.addEventListener('mousemove', (event) => {
        if (!mouseDown) return;

        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;

        const spherical = new THREE.Spherical();
        spherical.setFromVector3(camera.position);
        spherical.theta -= deltaX * 0.01;
        spherical.phi += deltaY * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

        camera.position.setFromSpherical(spherical);
        camera.lookAt(0, 0, 0);

        mouseX = event.clientX;
        mouseY = event.clientY;
    });

    renderer.domElement.addEventListener('mouseup', () => {
        mouseDown = false;
    });

    renderer.domElement.addEventListener('wheel', (event) => {
        const scale = event.deltaY > 0 ? 1.1 : 0.9;
        camera.position.multiplyScalar(scale);
        camera.position.clampLength(1, 50);
    });
}

function addAudioBackground() {
    const fileInput = document.getElementById('audioFile');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please select an audio file first');
        return;
    }

    if (!file.type.startsWith('audio/')) {
        alert('Please select a valid audio file');
        return;
    }

    const audio = document.createElement('audio');
    const preview = document.getElementById('audioPreview');

    audio.src = URL.createObjectURL(file);
    preview.src = audio.src;
    preview.style.display = 'block';

    audio.loop = true;
    audio.volume = 0.5;

    // Store audio blob for export
    audioBlob = file;
    backgroundAudio = {
        element: audio,
        fileName: file.name,
        blob: file
    };

    fileInput.value = '';
}

// Update background color
function updateBackgroundColor() {
    const color = document.getElementById('bgColor').value;
    scene.background = new THREE.Color(color);
}

function addAudioTracks(files) {
    for (let file of files) {
        const trackId = 'audio_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const audioElement = new Audio();
        audioElement.src = URL.createObjectURL(file);
        audioElement.loop = false;
        audioElement.volume = 0.8;

        const track = {
            id: trackId,
            name: file.name,
            audio: audioElement,
            isPlaying: false,
            loop: false,
            startTime: 0,
            endTime: null,
            timelineMode: false,
            originalDuration: null,
            playOrder: audioTracks.length + 1,
            autoNext: false,
            isBackground: false
        };

        audioTracks.push(track);
        createAudioTrackUI(track);
    }
}

function createAudioTrackUI(track) {
    const tracksContainer = document.getElementById('audioTracks');
    const trackDiv = document.createElement('div');
    trackDiv.className = 'audio-track';
    trackDiv.id = track.id;
    trackDiv.innerHTML = `
    <div class="audio-track-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
                <input type="number" min="1" max="99" value="${track.playOrder}" readonly id="playOrder-${track.id}"
                    data-track="${track.id}" style="width:40px; padding:4px; background:#333; border:1px solid #555;
                color:#fff; border-radius:4px; text-align:center;" title="Play Order">
            <button onclick="moveTrackUp('${track.id}')" 
                    style="width: 24px; height: 24px; background: #555; border: none; color: #fff; border-radius: 4px; cursor: pointer; font-size: 12px;"
                    title="Move Up">↑</button>
            <button onclick="moveTrackDown('${track.id}')" 
                    style="width: 24px; height: 24px; background: #555; border: none; color: #fff; border-radius: 4px; cursor: pointer; font-size: 12px;"
                    title="Move Down">↓</button>
        </div>
        <div class="audio-track-name" style="flex: 1;">${track.name}</div>
        <div class="audio-controls-group">
            <button class="play-btn" onclick="toggleAudioTrack('${track.id}')" title="Play / Pause">▶</button>
            <button class="loop-toggle" onclick="toggleLoop('${track.id}')" title="Loop">🔁</button>
            <input type="range" class="volume-control" min="0" max="1" step="0.1" value="0.8" 
                   onchange="updateTrackVolume('${track.id}', this.value)" title="Volume">
            <div class="time-display">0:00</div>
            <button class="delete-track-btn" onclick="deleteAudioTrack('${track.id}')" title="Delete">✕</button>
        </div>
    </div>
    <div class="audio-timeline-controls" style="display: flex; gap: 8px; align-items: center; font-size: 11px; color: #ccc;">
        <label style="min-width: 60px;">Start Time:</label>
        <input type="number" min="0" max="999" step="0.1" value="0" 
               onchange="updateTimeSettings('${track.id}', 'start', this.value)"
               style="width: 60px; padding: 4px; background: #333; border: 1px solid #555; color: #fff; border-radius: 4px;">
        <span>sec</span>
        
        <label style="min-width: 60px; margin-left: 12px;">End Time:</label>
        <input type="number" min="0" max="999" step="0.1" value="0" 
               onchange="updateTimeSettings('${track.id}', 'end', this.value)"
               style="width: 60px; padding: 4px; background: #333; border: 1px solid #555; color: #fff; border-radius: 4px;">
        <span>sec</span>
        
        <button onclick="toggleTimelineMode('${track.id}')" 
                style="margin-left: 12px; padding: 4px 8px; background: #555; border: none; color: #fff; border-radius: 4px; font-size: 10px; cursor: pointer;"
                title="Enable / Disable Timeline Control">Timeline</button>
                
        <label style="margin-left: 12px; font-size: 10px;">
            <input type="checkbox" onchange="updateAutoNext('${track.id}', this.checked)" style="margin-right: 4px;">
            Auto-play next after finished
        </label>
        
        <label style="margin-left: 12px; font-size: 10px;">
            <input type="checkbox" onchange="toggleBackgroundMusic('${track.id}', this.checked)" style="margin-right: 4px;">
            Set as background music
        </label>
    </div>
`;


    tracksContainer.appendChild(trackDiv);

    // Add event listeners for time updates
    track.audio.addEventListener('timeupdate', () => updateTimeDisplay(track.id));
    track.audio.addEventListener('ended', () => onTrackEnded(track.id));

    // Load duration when metadata is loaded
    track.audio.addEventListener('loadedmetadata', () => {
        const endInput = trackDiv.querySelector('input[onchange*="end"]');
        endInput.max = Math.floor(track.audio.duration);
        endInput.value = Math.floor(track.audio.duration);
        track.endTime = track.audio.duration;
    });

    reorderAudioDisplay();
}


function reorderAudioDisplay() {
    const tracksContainer = document.getElementById('audioTracks');

    const sortedTracks = audioTracks.sort((a, b) => a.playOrder - b.playOrder);

    sortedTracks.forEach(track => {
        const element = document.getElementById(track.id);

        if (element) {
            tracksContainer.appendChild(element);
        }
    });
}

//Change track to top     
function moveTrackUp(trackId) {
    const track = audioTracks.find(t => t.id === trackId);
    if (!track || track.playOrder <= 1) return;

    const prevTrack = audioTracks.find(t => t.playOrder === track.playOrder - 1);
    if (prevTrack) {
        prevTrack.playOrder++;
        track.playOrder--;
        updateOrderInputs();
        reorderAudioDisplay();
    }
}

//Change  track to down 
function moveTrackDown(trackId) {
    const track = audioTracks.find(t => t.id === trackId);
    if (!track) return;

    const maxOrder = Math.max(...audioTracks.map(t => t.playOrder));
    if (track.playOrder >= maxOrder) return;

    const nextTrack = audioTracks.find(t => t.playOrder === track.playOrder + 1);
    if (nextTrack) {
        nextTrack.playOrder--;
        track.playOrder++;
        updateOrderInputs();
        reorderAudioDisplay();
    }
}

function updateOrderInputs() {
    audioTracks.forEach(track => {
        const input = document.getElementById(`playOrder-${track.id}`);
        if (input) {
            input.value = track.playOrder;
        }
    });
}

function toggleAudioTrack(trackId) {
    const track = audioTracks.find(t => t.id === trackId);
    const button = document.querySelector(`#${trackId} .play-btn`);

    if (track.isPlaying) {
        track.audio.pause();
        track.isPlaying = false;
        button.textContent = '▶';
        button.classList.remove('playing');

        if (track.isBackground) {
            backgroundMusic.isPlaying = false;
        }
    } else {
        if (!track.isBackground && backgroundMusic.isPlaying) {
            fadeBackgroundMusic(true);
        }

        if (track.timelineMode && track.startTime > 0) {
            track.audio.currentTime = track.startTime;
        }

        track.audio.play();
        track.isPlaying = true;
        button.textContent = '⏸';
        button.classList.add('playing');

        if (track.isBackground) {
            backgroundMusic.isPlaying = true;
        }
    }
}

function toggleLoop(trackId) {
    const track = audioTracks.find(t => t.id === trackId);
    const button = document.querySelector(`#${trackId} .loop-toggle`);

    track.loop = !track.loop;

    if (track.loop) {
        button.classList.add('active');
        button.title = 'stop loop';
    } else {
        button.classList.remove('active');
        button.title = 'Loop';
    }
}

function updateTrackVolume(trackId, volume) {
    const track = audioTracks.find(t => t.id === trackId);
    track.audio.volume = parseFloat(volume);
}

function deleteAudioTrack(trackId) {
    const trackIndex = audioTracks.findIndex(t => t.id === trackId);
    if (trackIndex > -1) {
        const track = audioTracks[trackIndex];
        track.audio.pause();
        URL.revokeObjectURL(track.audio.src);
        audioTracks.splice(trackIndex, 1);

        const trackElement = document.getElementById(trackId);
        trackElement.remove();
    }
}

function updateTimeSettings(trackId, type, value) {
    const track = audioTracks.find(t => t.id === trackId);
    if (!track) return;

    const numValue = parseFloat(value);

    if (type === 'start') {
        track.startTime = numValue;
    } else if (type === 'end') {
        track.endTime = numValue > 0 ? numValue : track.audio.duration;
    }

    if (track.startTime >= track.endTime) {
        track.startTime = Math.max(0, track.endTime - 0.1);
        const startInput = document.querySelector(`#${trackId} input[onchange*="start"]`);
        if (startInput) startInput.value = track.startTime;
        track.timelineMode = !track.timelineMode;
    }
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

    // Add audio asset if exists
    if (backgroundAudio) {
        htmlContent += `
            <audio id="background-audio" src="audio/${backgroundAudio.fileName}" loop autoplay></audio>`;
    }

    // Add image assets
    imageLayers.forEach(layer => {
        htmlContent += `
            <img id="img-${layer.id}" src="images/${layer.name}" crossorigin="anonymous">`;
    });

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
    let markerVisible = false;

    document.querySelector('a-marker').addEventListener('markerFound', function() {
        markerVisible = true;
        console.log('Marker found - starting animations and audio');
        
        // Start background audio if exists
        const audio = document.querySelector('#background-audio');
        if (audio) {
            audio.play().catch(e => console.log('Audio autoplay blocked:', e));
        }
        
        playAllAnimations();
    });

       
    document.querySelector('a-marker').addEventListener('markerLost', function() {
        markerVisible = false;
        console.log('Marker lost - stopping animations and audio');
        
        // Stop background audio if exists
        const audio = document.querySelector('#background-audio');
        if (audio) {
            audio.pause();
        }
        stopAllAnimations();
    });
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

async function exportAsAR() {
    const name = (document.getElementById('projectName').value || 'AR_Project').trim();
    const zip = new JSZip();

    zip.file(name + '.html', generateHTMLContent());
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

    if (backgroundAudio) {
        const audioFiles = zip.folder('audio');
        audioFiles.file(backgroundAudio.fileName, backgroundAudio.blob);
    }

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

    // Save the zip file
    zip.generateAsync({ type: "blob" }).then(function (content) {
        saveAs(content, name + "_AR_Package.zip");
    });
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