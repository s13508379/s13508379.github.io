

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