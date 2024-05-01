import * as THREE from "three";

// variables
const imageContainer = document.getElementById("imageContainer");
const imageElement = document.getElementById("myImage");

let easeFactor = 0.02;
let scene, camera, renderer, planeMesh;
let mousePosition = { x: 0.5, y: 0.5 };
let targetMousePosition = { x: 0.5, y: 0.5 };
let mouseStopTimeout;
let aberrationIntensity = 0.0;
let lastPosition = { x: 0.5, y: 0.5 };
let prevPosition = { x: 0.5, y: 0.5 };
let isDragging = false;
let dragStart = { x: 0, y: 0 };

// shaders
const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    varying vec2 vUv;
    uniform sampler2D u_texture;    
    uniform vec2 u_mouse;
    uniform vec2 u_prevMouse;

    void main() {
        vec2 gridUV = floor(vUv * vec2(10000.0, 10000.0)) / vec2(10000.0, 10000.0);
        vec2 centerOfPixel = gridUV + vec2(1.0/10000.0, 1.0/10000.0);
        
        vec2 mouseDirection = u_mouse - u_prevMouse;
        
        vec2 pixelToMouseDirection = centerOfPixel - u_mouse;
        float pixelDistanceToMouse = length(pixelToMouseDirection);
        float strength = smoothstep(1.0, 0.0, pixelDistanceToMouse);
 
        vec2 uvOffset = strength * + mouseDirection * 0.2;
        vec2 uv = vUv - uvOffset;

        gl_FragColor = texture2D(u_texture, uv);
    }
`;


function initializeScene(texture) {
  //   scene creation
  scene = new THREE.Scene();

  // camera setup
  camera = new THREE.PerspectiveCamera(
    80,
    imageElement.offsetWidth / imageElement.offsetHeight,
    0.01,
    10
  );
  camera.position.z = 1;

  //   uniforms
  let shaderUniforms = {
    u_mouse: { type: "v2", value: new THREE.Vector2() },
    u_prevMouse: { type: "v2", value: new THREE.Vector2() },
    u_texture: { type: "t", value: texture },
  };

  //   creating a plane mesh with materials
  planeMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2, 20, 20),
    new THREE.ShaderMaterial({
      uniforms: shaderUniforms,
      vertexShader,
      fragmentShader,
    })
  );

  console.log('planeMesh ===== ', planeMesh);

  //   add mesh to scene
  scene.add(planeMesh);

  //   render
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(imageElement.offsetWidth, imageElement.offsetHeight);

  //   create a canvas
  imageContainer.appendChild(renderer.domElement);
}

// use the existing image from html in the canvas
initializeScene(new THREE.TextureLoader().load(imageElement.src));

animateScene();

function animateScene() {
  requestAnimationFrame(animateScene);

if (isDragging) {
    planeMesh.material.uniforms.u_mouse.value.set(mousePosition.x, 1.0 - mousePosition.y);
    planeMesh.material.uniforms.u_prevMouse.value.set(prevPosition.x, 1.0 - prevPosition.y);
}

    renderer.render(scene, camera);
}


imageContainer.addEventListener('mousedown', function(event) {
    isDragging = true;
    easeFactor = 0.02;
    prevPosition = { ...mousePosition }; // Capture the start position
    updateMousePosition(event);
});

imageContainer.addEventListener('mousemove', function(event) {
    if (isDragging) {
        easeFactor = 0.1; // Slow down the movement
        updateMousePosition(event);
        aberrationIntensity = 1.0; // Set the intensity of distortion
    }
});

imageContainer.addEventListener('mouseup', function(event) {
    isDragging = false;
    aberrationIntensity = 0.0; // Reset or reduce the distortion
});

function updateMousePosition(event) {
    const rect = imageContainer.getBoundingClientRect();
    mousePosition.x = (event.clientX - rect.left) / rect.width;
    mousePosition.y = (event.clientY - rect.top) / rect.height;
}
