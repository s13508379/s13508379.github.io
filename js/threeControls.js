// threeControls.js - Clean version without control panel

// Add enhanced mouse controls for camera with free movement
function addMouseControls() {
    let mouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let isRightClick = false;
    let keys = {};

    // Mouse controls
    renderer.domElement.addEventListener('mousedown', (event) => {
        mouseDown = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
        isRightClick = event.button === 2; // Right mouse button
        event.preventDefault();
    });

    renderer.domElement.addEventListener('mousemove', (event) => {
        if (!mouseDown) return;

        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;

        if (isRightClick) {
            // Right mouse: Pan camera
            const panSpeed = 0.01;
            const right = new THREE.Vector3();
            const up = new THREE.Vector3();
            
            camera.getWorldDirection(new THREE.Vector3()); // Update camera matrix
            right.setFromMatrixColumn(camera.matrixWorld, 0);
            up.setFromMatrixColumn(camera.matrixWorld, 1);
            
            right.multiplyScalar(-deltaX * panSpeed);
            up.multiplyScalar(deltaY * panSpeed);
            
            camera.position.add(right);
            camera.position.add(up);
        } else {
            // Left mouse: Orbit camera around center (0, 0, 0)
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(camera.position);
            spherical.theta -= deltaX * 0.01;
            spherical.phi += deltaY * 0.01;
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

            camera.position.setFromSpherical(spherical);
            camera.lookAt(0, 0, 0);
        }

        mouseX = event.clientX;
        mouseY = event.clientY;
    });

    renderer.domElement.addEventListener('mouseup', () => {
        mouseDown = false;
        isRightClick = false;
    });

    // Prevent context menu on right click
    renderer.domElement.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });

    // Mouse wheel: Zoom in/out (move forward/backward)
    renderer.domElement.addEventListener('wheel', (event) => {
        const zoomSpeed = 0.1;
        const direction = event.deltaY > 0 ? zoomSpeed : -zoomSpeed;
        camera.translateZ(direction);
        event.preventDefault();
    });

    // Keyboard controls
    document.addEventListener('keydown', (event) => {
        // Allow Ctrl+R and other browser shortcuts
        if (event.ctrlKey || event.metaKey) {
            return; // Don't prevent default for Ctrl/Cmd combinations
        }
        
        // Don't interfere with input fields
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.contentEditable === 'true') {
            return; // Allow normal typing in input fields
        }
        
        // Only prevent default for our control keys
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyR', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Digit1', 'Digit2', 'Digit3', 'Digit4'].includes(event.code)) {
            event.preventDefault();
        }
        
        keys[event.code] = true;
    });

    document.addEventListener('keyup', (event) => {
        // Don't interfere with input fields
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.contentEditable === 'true') {
            return;
        }
        
        keys[event.code] = false;
    });

    // Update camera based on keyboard input
    function updateCameraFromKeyboard() {
        const moveSpeed = 0.1;
        const rotateSpeed = 0.05;

        // Movement controls (WASD) - free movement
        if (keys['KeyW']) camera.translateZ(-moveSpeed);
        if (keys['KeyS']) camera.translateZ(moveSpeed);
        if (keys['KeyA']) camera.translateX(-moveSpeed);
        if (keys['KeyD']) camera.translateX(moveSpeed);
        if (keys['KeyQ']) camera.translateY(-moveSpeed);
        if (keys['KeyE']) camera.translateY(moveSpeed);

        // Rotation controls (Arrow keys) - free rotation
        if (keys['ArrowUp']) camera.rotateX(rotateSpeed);
        if (keys['ArrowDown']) camera.rotateX(-rotateSpeed);
        if (keys['ArrowLeft']) camera.rotateY(rotateSpeed);
        if (keys['ArrowRight']) camera.rotateY(-rotateSpeed);

        // Reset camera (R key)
        if (keys['KeyR']) {
            resetCamera();
            keys['KeyR'] = false;
        }

        // Toggle view modes
        if (keys['Digit1']) {
            setViewMode('front');
            keys['Digit1'] = false;
        }
        if (keys['Digit2']) {
            setViewMode('side');
            keys['Digit2'] = false;
        }
        if (keys['Digit3']) {
            setViewMode('top');
            keys['Digit3'] = false;
        }
        if (keys['Digit4']) {
            setViewMode('ar');
            keys['Digit4'] = false;
        }
    }

    // Add keyboard update to animation loop
    function keyboardLoop() {
        updateCameraFromKeyboard();
        requestAnimationFrame(keyboardLoop);
    }
    keyboardLoop();
}

// Different view modes for better visual control
function setViewMode(mode) {
    switch (mode) {
        case 'front':
            camera.position.set(0, 0, 8);
            camera.rotation.set(0, 0, 0); // Don't force lookAt
            break;
        case 'side':
            camera.position.set(8, 0, 0);
            camera.rotation.set(0, Math.PI / 2, 0); // Face toward center
            break;
        case 'top':
            camera.position.set(0, 8, 0);
            camera.rotation.set(-Math.PI / 2, 0, 0); // Face downward
            break;
        case 'ar':
            camera.position.set(0, 0, 3); // AR.js simulation view
            camera.rotation.set(0, 0, 0); // Don't force lookAt
            break;
        case 'free':
            // Keep current position and rotation
            break;
    }
    console.log(`View mode: ${mode}`);
}

function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');

    // Set up camera for flexible viewing
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Start with AR simulation view but allow free movement
    camera.position.set(0, 0, 3);
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

    // Create a marker representation with exact AR.js proportions
    const markerGeometry = new THREE.PlaneGeometry(2, 2);
    const markerMaterial = new THREE.MeshBasicMaterial({ 
        color: "#333333", 
        transparent: true, 
        opacity: 0.2,
        side: THREE.DoubleSide 
    });
    const markerPlane = new THREE.Mesh(markerGeometry, markerMaterial);
    markerPlane.rotation.x = -Math.PI / 2;
    scene.add(markerPlane);

    // Add coordinate system helper
    const axesHelper = new THREE.AxesHelper(1.5);
    scene.add(axesHelper);

    // Add phone/camera representation to show viewing perspective
    const phoneGeometry = new THREE.BoxGeometry(0.15, 0.3, 0.05); // Phone-sized in AR scale
    const phoneMaterial = new THREE.MeshBasicMaterial({
        color: "#2c3e50",
        transparent: true,
        opacity: 0.7
    });
    const phoneIcon = new THREE.Mesh(phoneGeometry, phoneMaterial);
    phoneIcon.position.set(0, 2, 5); // Same as camera position
    phoneIcon.lookAt(0, 0, 0); // Point towards marker
    scene.add(phoneIcon);

    // Add scale grid for reference
    const gridHelper = new THREE.GridHelper(4, 20, "#444444", "#222222"); // Smaller grid for AR scale
    gridHelper.position.y = -0.01; // Slightly below marker
    scene.add(gridHelper);

    // Add camera position indicator
    const cameraIndicator = new THREE.SphereGeometry(0,0,0);
    const cameraIndicatorMaterial = new THREE.MeshBasicMaterial({ color: "#00ff00" });
    const cameraIndicatorMesh = new THREE.Mesh(cameraIndicator, cameraIndicatorMaterial);
    scene.add(cameraIndicatorMesh);

    // Update camera indicator position in animation loop
    function updateCameraIndicator() {
        cameraIndicatorMesh.position.copy(camera.position);
        cameraIndicatorMesh.position.normalize();
        cameraIndicatorMesh.position.multiplyScalar(0.8);
    }

    // Add update to animation loop
    const originalAnimate = animate;
    animate = function() {
        updateCameraIndicator();
        originalAnimate();
    };


    addMouseControls();
    animate();
}

// Update the reset camera function
function resetCamera() {
    camera.position.set(0, 0, 3);
    camera.rotation.set(0, 0, 0); // Don't force lookAt
    console.log("Camera reset to AR simulation view");
}

window.addEventListener('load', initScene);