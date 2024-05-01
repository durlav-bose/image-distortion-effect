import * as THREE from 'three';

// Setup the scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a plane geometry with more divisions for finer control
const planeGeometry = new THREE.PlaneGeometry(10, 10, 2, 3); // Increased subdivisions
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
const plane = new THREE.Mesh(planeGeometry, material);
scene.add(plane);

let count = planeGeometry.attributes.position.count;

for(let i = 0; i < count; i++) {
    const distanceFromCenter = Math.abs(planeGeometry.attributes.position.getX(i));
    const maxAmplitude = 2;
    const wavelength = 7;
    planeGeometry.attributes.position.setZ(i, planeGeometry.attributes.position.getZ(i) + maxAmplitude * Math.cos((planeGeometry.attributes.position.getX(i) / wavelength) * Math.PI));
}

// Ensure the geometry is updated
planeGeometry.verticesNeedUpdate = true;

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
