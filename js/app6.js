import * as THREE from 'three';

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load the texture
const loader = new THREE.TextureLoader();
const texture = loader.load('../images/murkho.jpg');

// Create a plane that represents the cropping area
const geometry = new THREE.PlaneGeometry(2, 2);  // Size of the crop area
const material = new THREE.MeshBasicMaterial({ map: texture });
const plane = new THREE.Mesh(geometry, material);
// Add the plane to the scene
scene.add(plane);

console.log('plane :>> ', plane);

// Render loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
