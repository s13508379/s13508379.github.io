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

    // const planeGeometry = new THREE.PlaneGeometry(4, 4);
    // const planeMaterial = new THREE.MeshBasicMaterial({
    //     color: "#444444",
    //     transparent: true,
    //     opacity: 0.2,
    //     side: THREE.DoubleSide
    // });

    // const referencePlane = new THREE.Mesh(planeGeometry, planeMaterial);
    // referencePlane.rotation.x = -Math.PI / 2;
    // referencePlane.position.y = 0;
    // scene.add(referencePlane);

    const phoneGeometry = new THREE.BoxGeometry(0.1, 1, 2);
    const phoneMaterial = new THREE.MeshBasicMaterial({ color: "#2c3e50" });
    const phoneIcon = new THREE.Mesh(phoneGeometry, phoneMaterial);
    phoneIcon.position.set(0, 4, 0);
    phoneIcon.rotation.z = Math.PI / 2;
    scene.add(phoneIcon);

    addMouseControls();
    animate();
}

// Update background color
function updateBackgroundColor() {
    const color = document.getElementById('bgColor').value;
    scene.background = new THREE.Color(color);
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

    // Add background audio (legacy support)
    if (backgroundAudio) {
        const audioFiles = zip.folder('audio');
        audioFiles.file(backgroundAudio.fileName, backgroundAudio.blob);
    }

    // Add audio tracks from the audio system
    if (typeof audioTracks !== 'undefined' && audioTracks.length > 0) {
        const audioFiles = zip.folder('audio');

        // Process each audio track
        for (const track of audioTracks) {
            try {
                // Get audio blob from the audio element
                const audioBlob = await getAudioBlobFromElement(track.audio);
                if (audioBlob) {
                    const safeFileName = sanitizeFileName(track.name);
                    const fileName = `${safeFileName}.mp3`;
                    audioFiles.file(fileName, audioBlob);
                    console.log(`Added audio track: ${track.name} (${fileName})`);
                }
            } catch (error) {
                console.error(`Error processing audio track ${track.name}:`, error);
            }
        }

        console.log(`Added ${audioTracks.length} audio tracks to export`);
    }

    // Add QR code if URL is provided
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

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, size, size);

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

    // Generate and save the zip file
    try {
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, name + "_AR_Package.zip");
        console.log(`AR Package exported successfully: ${name}_AR_Package.zip`);
    } catch (error) {
        console.error('Error generating zip file:', error);
    }
}

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

// Initialize scene when page loads
window.addEventListener('load', initScene);