import * as THREE from 'three';
import vertexShader from './shaders/vertexShader.glsl';
import fragmentShader from './shaders/fragmentShader.glsl';

const scene = new THREE.Scene();
let perspective = 1000;
const fov = (180 * (2 * Math.atan(window.innerHeight / 2 / perspective))) / Math.PI;
const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(0, 0, perspective);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);


let scrollable = document.querySelector('.scrollable');

let current = 0;
let target = 0;
let ease = 0.075;

function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

function init() {
    document.body.style.height = `${scrollable.getBoundingClientRect().height}px`;
}

function smoothScroll() {
    target = window.scrollY;
    current = lerp(current, target, ease);
    scrollable.style.transform = `translate3d(0,${-current}px, 0)`;
}

init();
smoothScroll();

let images = document.querySelector('img');
let geometry = new THREE.PlaneGeometry(10, 10, 100, 100);
images = Array.from(images).map(image => {
    let texture = new THREE.TextureLoader().load(image.src);
    let material = new THREE.ShaderMaterial({
        uniforms: {
            uTexture: { value: texture },
            uTime: { value: 1 },
            uOffset: { value: new THREE.Vector2(0.0, 0.0) },
            uAlpha: { value: 1.0 }

        },
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
        wireframe: true
    });

    let meshItem = new THREE.Mesh(geometry, material);
    scene.add(meshItem);
});

// Variables to track drag state
let isDragging = false;
let previousMousePosition = {
    x: 0,
    y: 0
};

let startPos = 0;
let startScroll = 0;
let rayCast = new THREE.Raycaster();
let mouse = new THREE.Vector2();

renderer.domElement.addEventListener('mousedown', onMouseDown, false);
renderer.domElement.addEventListener('mouseup', onMouseUp, false);
renderer.domElement.addEventListener('mousemove', onMouseMove, false);

function onMouseDown(event) {
    isDragging = true;
    previousMousePosition = {
        x: event.clientX,
        y: event.clientY
    };
    startPos = event.clientY;
    startScroll = target;
    document.body.style.userSelect = 'none';

    // Update the mouse variable
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycast
    rayCast.setFromCamera(mouse, camera);
    let intersects = rayCast.intersectObjects(scene.children);
    if (intersects.length > 0) {
        console.log(intersects[0].object);
    }
}

function onMouseMove(event) {
    if (isDragging) {
        const diff = e.clientY - startPos;
        target = startScroll - diff;
    }
}

function onMouseUp(event) {
    isDragging = false;
    document.body.style.userSelect = '';
}

function render() {
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

render();
