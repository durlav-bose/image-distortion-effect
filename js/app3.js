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
let cumulativeDistortion = new THREE.Vector2();

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
    uniform vec2 u_mouse; // Current mouse position in normalized coordinates
    uniform vec2 u_cumulativeDistortion; // The accumulated distortion

    void main() {
        // Calculate vector from current UV to the mouse position
        vec2 dir = vUv - u_mouse;

        // Calculate distortion strength based on the distance to the mouse position
        float dist = length(dir);
        float power = exp(-dist * 20.0); // Adjust '20.0' to change the falloff of the distortion

        // Apply distortion
        vec2 distortedUv = vUv + normalize(dir) * u_cumulativeDistortion * power;
        
        gl_FragColor = texture2D(u_texture, distortedUv);
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
  camera.position.z = 2;

  //   uniforms
  let shaderUniforms = {
    u_mouse: { type: "v2", value: new THREE.Vector2() },
    u_prevMouse: { type: "v2", value: new THREE.Vector2() },
    u_texture: { type: "t", value: texture },
    u_cumulativeDistortion: { type: "v2", value: cumulativeDistortion },
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

  let controlPoints = [];

  let count = planeMesh.geometry.attributes.position.count;
  for (let i = 0; i < count; i++) {
    let x = planeMesh.geometry.attributes.position.getX(i);
    let y = planeMesh.geometry.attributes.position.getY(i);
    let z = planeMesh.geometry.attributes.position.getZ(i);
    

    let point = new THREE.Vector3(x, y, z);
    controlPoints.push(point);

    const cpGeometry = new THREE.SphereGeometry(0.01, 32, 32);
    const cpMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const cpMesh = new THREE.Mesh(cpGeometry, cpMaterial);
    cpMesh.position.set(x, y, z);
    scene.add(cpMesh);
  }

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
      // Calculate the direction and strength of the distortion
      let dx = (mousePosition.x - prevPosition.x);
      let dy = (mousePosition.y - prevPosition.y);
      let currentDistortion = new THREE.Vector2(dx, dy);

      // Gradually apply distortion
      cumulativeDistortion.lerp(currentDistortion, 0.1);

      // Update uniforms
      planeMesh.material.uniforms.u_mouse.value.set(mousePosition.x, mousePosition.y);
      planeMesh.material.uniforms.u_cumulativeDistortion.value.copy(cumulativeDistortion);
  }

  renderer.render(scene, camera);
}

function updateMousePosition(event) {
  const rect = imageContainer.getBoundingClientRect();
  mousePosition.x = (event.clientX - rect.left) / rect.width;
  mousePosition.y = (event.clientY - rect.top) / rect.height;
}


imageContainer.addEventListener('mousedown', function(event) {
    isDragging = true;
    easeFactor = 0.02;
    dragStart.x = event.clientX;
    dragStart.y = event.clientY;
    prevPosition = { ...mousePosition }; // Capture the start position
    updateMousePosition(event);
});

imageContainer.addEventListener('mousemove', function(event) {
  updateMousePosition(event);
  // prevPosition = { ...mousePosition }; // Capture the previous position
    if (isDragging) {
        easeFactor = 0.1; // Slow down the movement
        // updateMousePosition(event);
        aberrationIntensity = 1.0; // Set the intensity of distortion
    }
});

imageContainer.addEventListener('mouseup', function(event) {
    isDragging = false;
    aberrationIntensity = 0.0; // Reset or reduce the distortion
});

