import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Define the control points for the curves
let controlPoints = [
    new THREE.Vector2(-1, 1.0), // Top-Left corner control point
    new THREE.Vector2(0, 1.0), // Top control point
    new THREE.Vector2(1, 1.0), // Top-Right corner control point
    new THREE.Vector2(1, -1.0), // Bottom-Right corner control point
    new THREE.Vector2(0, -1), // Bottom control point
    new THREE.Vector2(-1, -1.0), // Bottom-Left corner control point
    new THREE.Vector2(0, 0), // Center control point
  ];
  

// Create control point meshes
let controlPointGeometry = new THREE.CircleGeometry(0.05, 32);
let controlPointMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff, side: THREE.DoubleSide });
let controlPointMeshes = controlPoints.map((point, index) => {
  let names = [
    "top-left",
    "top",
    "top-right",
    "bottom-right",
    "bottom",
    "bottom-left",
    "center",
  ];
  let mesh = new THREE.Mesh(controlPointGeometry, controlPointMaterial);
  mesh.name = names[index];
  mesh.position.set(point.x, point.y, 0.1);
    scene.add(mesh);
  return mesh;
});

// Create the curves
let curveTop = new THREE.QuadraticBezierCurve(
  controlPoints[0],
  controlPoints[1],
  controlPoints[2]
);

let curveBottom = new THREE.QuadraticBezierCurve(
  controlPoints[5],
  controlPoints[4],
  controlPoints[3]
);

const curveTopPoints = curveTop.getPoints(1000);
const curveBottomPoints = curveBottom.getPoints(1000);

// We will create a geometry that has vertices along these curves
const vertices = [];
const uvs = [];
curveTopPoints.forEach((point, index) => {
    // Top vertices (assuming z = 0 for simplicity)
    vertices.push(point.x, point.y, 0);
    let uv = index / (curveTopPoints.length - 1);
    console.log('uv :>> ', uv);
    uvs.push(index / (curveTopPoints.length - 1), 1); // UV mapping

    // Corresponding bottom vertices
    const bottomPoint = curveBottomPoints[index];
    vertices.push(bottomPoint.x, bottomPoint.y, 0);
    uvs.push(index / (curveBottomPoints.length - 1), 0); // UV mapping
});

// Create indices for the triangles
const indices = [];
for (let i = 0; i < curveTopPoints.length - 1; i++) {
    // Two triangles per segment
    const a = i * 2; // Top vertex index
    const b = a + 1; // Bottom vertex index
    const c = a + 2; // Next top vertex index
    const d = b + 2; // Next bottom vertex index

    // First triangle (a, b, d)
    indices.push(a, b, d);
    // Second triangle (a, d, c)
    indices.push(a, d, c);
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
geometry.setIndex(indices);
geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));


const vertexShader = `
    varying vec2 vUv;
    uniform vec3 u_controlPoint; // Use vec3 for compatibility with Three.js Vector3
    uniform bool u_distort; // Uniform to control distortion
    uniform float distortionFactor;

    void main() {
        vUv = uv;
        vec3 pos = position;
        float delta = pos.x - 0.0;

        if(delta > 0.0 && u_distort && u_controlPoint.x > 0.0) {
            // delta = delta / u_controlPoint.x * .055;
            vUv.x = vUv.x + distortionFactor * delta * (u_controlPoint.x * 100.0);
        } else if(delta < 0.0 && u_distort && u_controlPoint.x < 0.0) {
            vUv.x = vUv.x - distortionFactor * delta * (u_controlPoint.x * 100.0);
        }
        
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
`;

const fragmentShader = `
    varying vec2 vUv;
    uniform sampler2D u_texture;
    void main() {
        gl_FragColor = texture2D(u_texture, vUv);
    }
`;

const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
        u_texture: { value: new THREE.TextureLoader().load('../images/girl.jpg') }, // Replace with your image path
        u_controlPoint: { value: new THREE.Vector2() },
        u_distort: { value: false },
        distortionFactor: { value: 0.0 },
    }
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

console.log('mesh :>> ', mesh);


// create the border
const borderMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff });
const borderGeometry = new THREE.BufferGeometry().setFromPoints([...curveTopPoints, ...curveBottomPoints.reverse()]);
const borderLine = new THREE.LineLoop(borderGeometry, borderMaterial);
scene.add(borderLine);


const rayCaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedMesh = null;

renderer.domElement.addEventListener('mousedown', onMouseDown, false);
renderer.domElement.addEventListener('mousemove', onMouseMove, false);
renderer.domElement.addEventListener('mouseup', () => {
    selectedMesh = null;
}, false);

function onMouseDown(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    rayCaster.setFromCamera(mouse, camera);
    const intersects = rayCaster.intersectObjects(controlPointMeshes);

    if (intersects.length > 0) {
        selectedMesh = intersects[0].object;
    }
}

function onMouseMove(event) {
    if (!selectedMesh) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    rayCaster.setFromCamera(mouse, camera);

    const intersects = rayCaster.intersectObject(plane);

    const point = intersects[0].point;
    const index = controlPointMeshes.findIndex((mesh) => mesh === selectedMesh);
    if (intersects.length > 0) {
        if(selectedMesh.name !== 'center') {
            const index = controlPointMeshes.findIndex((mesh) => mesh === selectedMesh);
            controlPoints[index].set(point.x, point.y); 
            selectedMesh.position.set(point.x, point.y, 0.1);
            updateCurve();
        } else {
            // distort the image using the center control point using shader
            const center = controlPoints[6];
            controlPoints[index].set(point.x, point.y);
            selectedMesh.position.set(point.x, point.y, 0.1);
            updateControlPointPosition(point);
        }
        
    }
}

function updateControlPointPosition(newPosition) {
    console.log('newPosition :>> ', newPosition);
    material.uniforms.u_controlPoint.value.x = newPosition.x;
    material.uniforms.u_controlPoint.value.y = newPosition.y;
    material.uniforms.u_controlPoint.value.z = 0; // Assuming z is 0 for a 2D plane distortion
    material.uniforms.u_distort.value = true;

    let distancex;
    if(controlPoints[6].x > 0) {
        distancex = controlPoints[6].x - controlPoints[0].x;
    } else {
        distancex = controlPoints[2].x - controlPoints[6].x;
    }
    material.uniforms.distortionFactor.value = -.05 / distancex / 50;
    material.uniformsNeedUpdate = true; // This line ensures that the changes are picked up
}

function updateCurve() {
    curveTop.v0 = controlPoints[0];
    curveTop.v1 = controlPoints[1];
    curveTop.v2 = controlPoints[2];
    curveBottom.v0 = controlPoints[5];
    curveBottom.v1 = controlPoints[4];
    curveBottom.v2 = controlPoints[3];
    const curveTopPoints = curveTop.getPoints(50);
    const curveBottomPoints = curveBottom.getPoints(50);
    const vertices = [];
    const uvs = [];
    curveTopPoints.forEach((point, index) => {
        vertices.push(point.x, point.y, 0);
        uvs.push(index / (curveTopPoints.length - 1), 1);

        const bottomPoint = curveBottomPoints[index];
        vertices.push(bottomPoint.x, bottomPoint.y, 0);
        uvs.push(index / (curveBottomPoints.length - 1), 0);
    });

    const indices = [];
    for (let i = 0; i < curveTopPoints.length - 1; i++) {
        const a = i * 2;
        const b = a + 1;
        const c = a + 2;
        const d = b + 2;

        indices.push(a, b, d);
        indices.push(a, d, c);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    mesh.geometry.dispose();
    mesh.geometry = geometry;

    // update the border
    borderGeometry.setFromPoints([...curveTopPoints, ...curveBottomPoints.reverse()]);
    borderLine.geometry.dispose();
    borderLine.geometry = borderGeometry;

    renderer.render(scene, camera);
}

// Set up the camera
camera.position.z = 5;

const planeGeometry = new THREE.PlaneGeometry(100, 100);
const planeMaterial = new THREE.MeshBasicMaterial({ visible: false }); // Invisible
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.lookAt(camera.position); // Make the plane face the camera

// Add the plane to the scene
scene.add(plane);

// Set up the orbit controls
const controls = new OrbitControls(camera, renderer.domElement);

// Render the scene
function animate() {
  requestAnimationFrame(animate);
  controls.enableRotate = false;
  controls.update();
  renderer.render(scene, camera);
}

animate();

let images = ["../images/1.jpeg", "../images/2.jpeg", "../images/3.jpeg", "../images/4.jpeg", "../images/murkho.jpg", "../images/fov.png"];


// Add a button in HTML
// <button id="changeImage">Change Image</button>

// JavaScript to handle the button click
document.getElementById('btn').addEventListener('click', function() {
    // Change the texture of the material
    let newTexture = new THREE.TextureLoader().load(images[Math.floor(Math.random() * images.length)]);
    material.uniforms.u_texture.value = newTexture;
    material.uniforms.u_texture.needsUpdate = true; // Make sure Three.js knows the texture needs updating

    // Optionally, if you are using caching or need to force a refresh
    renderer.render(scene, camera);
});