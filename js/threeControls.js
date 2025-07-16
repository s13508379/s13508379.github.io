

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
function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#000000');

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 7, 0);
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
    const phoneGeometry = new THREE.BoxGeometry(0.1, 1, 2);
    const phoneMaterial = new THREE.MeshBasicMaterial({ color: "#2c3e50" });
    const phoneIcon = new THREE.Mesh(phoneGeometry, phoneMaterial);
    phoneIcon.position.set(0, 7, 0);
    phoneIcon.rotation.z = Math.PI / 2;
    scene.add(phoneIcon);

    addMouseControls();
    animate();
}

window.addEventListener('load', initScene);