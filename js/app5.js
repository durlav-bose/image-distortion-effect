// import * as THREE from 'three';

// // Setup the basic scene
// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// camera.position.set(0, 0, 10);
// const renderer = new THREE.WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);

// // Create a plane geometry
// const geometry = new THREE.PlaneGeometry(5, 10, 10, 1);  // Width, height, width segments, height segments
// const material = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('https://threejs.org/examples/textures/uv_grid_opengl.jpg')});
// const plane = new THREE.Mesh(geometry, material);
// scene.add(plane);

// // Define control points
// const controlPointsTop = [
//     new THREE.Vector3(-5, 2.5, 0),  // Left
//     new THREE.Vector3(0, 5, 0),     // Middle top
//     new THREE.Vector3(5, 2.5, 0)    // Right
// ];
// const controlPointsBottom = [
//     new THREE.Vector3(-5, -2.5, 0),  // Left
//     new THREE.Vector3(0, -5, 0),     // Middle bottom
//     new THREE.Vector3(5, -2.5, 0)    // Right
// ];

// // Function to update the top and bottom curves
// function updateCurves() {
//     const curveTop = new THREE.CubicBezierCurve3(
//         controlPointsTop[0],
//         controlPointsTop[1],
//         controlPointsTop[1],  // Control point used twice for symmetry
//         controlPointsTop[2]
//     );
//     const curveBottom = new THREE.CubicBezierCurve3(
//         controlPointsBottom[0],
//         controlPointsBottom[1],
//         controlPointsBottom[1],  // Control point used twice for symmetry
//         controlPointsBottom[2]
//     );
    
//     const topPoints = curveTop.getPoints(10);
//     const bottomPoints = curveBottom.getPoints(10);

//     // console.log('topPoints :>> ', topPoints);
//     // console.log('bottomPoints :>> ', bottomPoints);
//     // console.log('plane.geometry.attributes :>> ', plane.geometry.attributes.position);
    
//     topPoints.forEach((point, i) => {
//         plane.geometry.attributes.position.setXYZ(i, point.x, point.y, point.z);
//     });
//     bottomPoints.forEach((point, i) => {
//         plane.geometry.attributes.position.setXYZ(i + 11, point.x, point.y, point.z);
//     });
//     plane.geometry.attributes.position.needsUpdate = true;
// }

// // Initial update
// updateCurves();
// // Render loop
// function animate() {
//     requestAnimationFrame(animate);
//     // make thhe curves update
//     let time = Date.now() * 0.001;
//     controlPointsTop[1].y = 2.5 + Math.sin(time) * 2.5; // Oscillate the middle top control point
//     // controlPointsBottom[1].y = -2.5 + Math.cos(time + Math.PI) * 2.5; // Oscillate the middle bottom control point inversely
  
//     controlPointsBottom[1].y = -2.5 + Math.sin(time) * 2.5; // Oscillate the middle bottom control point inversely
//     console.log('controlPointsTop[1].y :>> ', controlPointsTop[1].y);
//     console.log('controlPointsBottom[1].y :>> ', controlPointsBottom[1].y);

//     updateCurves();
//     renderer.render(scene, camera);
// }

// animate();


import * as THREE from 'three';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 10);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Plane geometry setup
const geometry = new THREE.PlaneGeometry(10, 5, 4, 1);
const texture = new THREE.TextureLoader().load('../images/girl.jpg');
const material = new THREE.MeshBasicMaterial({ map: texture });
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

const controlPointsTop = [
    new THREE.Vector3(-5, 2.5, 0),  // Left
    new THREE.Vector3(0, 5, 0),     // Middle top
    new THREE.Vector3(5, 2.5, 0)    // Right
];

const controlPointsBottom = [
    new THREE.Vector3(-5, -2.5, 0),  // Left
    new THREE.Vector3(0, -5, 0),     // Middle bottom
    new THREE.Vector3(5, -2.5, 0)    // Right
];

function updateCurves() {
    const curveTop = new THREE.CubicBezierCurve3(
        controlPointsTop[0],
        controlPointsTop[1],
        controlPointsTop[1],
        controlPointsTop[2]
    );
    const curveBottom = new THREE.CubicBezierCurve3(
        controlPointsBottom[0],
        controlPointsBottom[1],
        controlPointsBottom[1],
        controlPointsBottom[2]
    );

    const topPoints = curveTop.getPoints(4);
    const bottomPoints = curveBottom.getPoints(4);

    topPoints.forEach((point, i) => {
        plane.geometry.attributes.position.setXYZ(i, point.x, point.y, point.z);
        const geometry = new THREE.SphereGeometry(0.1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(point);
        scene.add(sphere);
    });
    bottomPoints.forEach((point, i) => {
        plane.geometry.attributes.position.setXYZ(i + 5, point.x, point.y, point.z);
        const geometry = new THREE.SphereGeometry(0.1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(point);
        scene.add(sphere);
    });

    plane.geometry.attributes.position.needsUpdate = true;
}

updateCurves();
let moveAmount = 0;
console.log('plane :>> ', plane);

// Update function
function updatePlane() {
    const positions = plane.geometry.attributes.position;
    const array = positions.array;

    for (let i = 0; i < array.length; i += 3) {
        const x = array[i];
        if (x > 0) {
            // Move right side vertices to the right
            array[i] += moveAmount;
        } else if (x < 0) {
            // Move left side vertices to the left
            array[i] -= moveAmount;
        }
    }

    positions.needsUpdate = true;
}

// Render loop
function animate() {
    requestAnimationFrame(animate);

    updateCurves();
    // Example dynamic change (could be tied to mouse or slider)
    moveAmount = 0.3 * Math.sin(Date.now() * 0.0000001); // Simple oscillation for demonstration

    updatePlane();
    renderer.render(scene, camera);
}

animate();



// import * as THREE from 'three';

// // Scene setup
// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
// camera.position.set(0, 0, 10);
// const renderer = new THREE.WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);

// // Plane geometry setup
// const geometry = new THREE.PlaneGeometry(10, 5, 50, 4); // More segments for smoother effect
// const texture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/uv_grid_opengl.jpg');
// const material = new THREE.MeshBasicMaterial({ map: texture });
// const plane = new THREE.Mesh(geometry, material);
// scene.add(plane);

// let startTime = Date.now(); // Store the start time for consistent animation speed

// // Update function
// function updatePlane() {
//     const positions = plane.geometry.attributes.position;
//     const array = positions.array;

//     const elapsedTime = Date.now() - startTime;
//     const speed = 0.0005; // Control speed of the oscillation
//     const period = 10000; // Milliseconds after which the cycle repeats

//     // Calculate moveAmount based on a sine wave, normalized to repeat every `period` ms
//     const moveAmount = 0.3 * Math.sin((2 * Math.PI * elapsedTime / period));

//     for (let i = 0; i < array.length; i += 3) {
//         const x = array[i];
//         if (x > 0 && x < 5)  {
//             array[i] = 5 + (x - 5) + moveAmount; // Original position plus moveAmount
//         } else if (x < 0 ) {
//             array[i] = -5 + (x + 5) - moveAmount; // Original position minus moveAmount
//         }
//     }

//     positions.needsUpdate = true;
// }

// // Render loop
// function animate() {
//     requestAnimationFrame(animate);

//     updatePlane(); // Update plane position based on the oscillation
//     renderer.render(scene, camera); // Render the scene
// }

// animate();
