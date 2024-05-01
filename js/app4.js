import * as THREE from "three";

// Setup the basic scene components
const imageContainer = document.getElementById("imageContainer");
const imageElement = document.getElementById("myImage");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Grid and Control Points
const gridHelper = new THREE.GridHelper(2, 2); // Visual grid helper
scene.add(gridHelper);

const controlGeometry = new THREE.SphereGeometry(0.05, 32, 32);
const controlMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const controlPoints = [];

// Function to update vertex positions based on control points
function updateVertexPosition() {
    planeMesh.geometry.vertices.forEach((vertex, idx) => {
        vertex.copy(controlPoints[idx].position);
    });
    planeMesh.geometry.verticesNeedUpdate = true;
}

// Setup control points
for (let i = 0; i < 9; i++) { // 3x3 grid has 9 control points
    const controlMesh = new THREE.Mesh(controlGeometry, controlMaterial);
    controlMesh.position.set(
        (i % 3 - 1) * 0.5, // x position
        Math.floor(i / 3) - 1 * 0.5, // y position
        0 // z position
    );
    scene.add(controlMesh);
    controlPoints.push(controlMesh);
}

// Load a texture
const loader = new THREE.TextureLoader();
const texture = loader.load(imageElement.src, (tex) => {
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
});

// Creating the mesh that will be distorted
const planeGeometry = new THREE.PlaneGeometry(2, 2, 2, 2); // 3x3 grid
const material = new THREE.MeshBasicMaterial({ map: texture });
const planeMesh = new THREE.Mesh(planeGeometry, material);
scene.add(planeMesh);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
