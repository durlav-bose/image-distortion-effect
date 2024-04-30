import * as THREE from 'three';
import vertexShader from './shaders/vertexShader.glsl';
import fragmentShader from './shaders/fragmentShader.glsl';

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

class EffectCanvas {
    constructor() {
        this.container = document.querySelector('main');
        this.images = [...document.querySelectorAll('img')];
        this.meshItems = [];
        this.setupCamera();
        this.createMeshItems();
        
        this.initMouseEvents();
        this.mousePosition = new THREE.Vector2();  // Add this to track mouse position relative to the center of the screen
        this.setupMouseEvents();
        this.render();
    }

    initMouseEvents() {
        let isDragging = false;
        let startPos = 0;
        let startScroll = 0;

        this.container.addEventListener('mousedown', (e) => {
            isDragging = true;
            startPos = e.clientY;
            startScroll = target;
            document.body.style.userSelect = 'none';
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const diff = e.clientY - startPos;
                target = startScroll - diff;
            }
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
            document.body.style.userSelect = '';
        });
    }

    setupMouseEvents() {
        window.addEventListener('mousemove', (e) => {
            // Normalize mouse coordinates to -1 to +1 range for both x and y
            this.mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mousePosition.y = - (e.clientY / window.innerHeight) * 2 + 1;
        });
    }

    get viewport() {
        let width = window.innerWidth;
        let height = window.innerHeight;
        let aspectRatio = width / height;
        return { width, height, aspectRatio };
    }

    setupCamera() {
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        this.scene = new THREE.Scene();
        let perspective = 1000;
        const fov = (180 * (2 * Math.atan(window.innerHeight / 2 / perspective))) / Math.PI;
        this.camera = new THREE.PerspectiveCamera(fov, this.viewport.aspectRatio, 1, 1000);
        this.camera.position.set(0, 0, perspective);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.viewport.width, this.viewport.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
    }

    onWindowResize() {
        init();
        this.camera.aspect = this.viewport.aspectRatio;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.viewport.width, this.viewport.height);
    }

    createMeshItems() {
        this.images.forEach(image => {
            let meshItem = new MeshItem(image, this.scene);
            this.meshItems.push(meshItem);
        });
    }

    render() {
        smoothScroll();
        this.meshItems.forEach(meshItem => {
            meshItem.render(this.mousePosition);
        });
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.render.bind(this));
    }
}

class MeshItem {
    constructor(element, scene) {
        this.element = element;
        this.scene = scene;
        this.offset = new THREE.Vector2(0, 0);
        this.sizes = new THREE.Vector2(0, 0);
        this.createMesh();
    }

    getDimensions() {
        const { width, height, top, left } = this.element.getBoundingClientRect();
        this.sizes.set(width, height);
        this.offset.set(left - window.innerWidth / 2 + width / 2, -top + window.innerHeight / 2 - height / 2);
    }

    createMesh() {
        this.geometry = new THREE.PlaneGeometry(1, 1, 100, 100);
        this.imageTexture = new THREE.TextureLoader().load(this.element.src);
        this.uniforms = {
            uTexture: { value: this.imageTexture },
            uOffset: { value: new THREE.Vector2(0.0, 0.0) },
            uAlpha: { value: 1.0 }
        };
        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            side: THREE.DoubleSide
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.getDimensions();
        this.mesh.position.set(this.offset.x, this.offset.y, 0);
        this.mesh.scale.set(this.sizes.x, this.sizes.y, 1);
        this.scene.add(this.mesh);
    }

    render(mousePosition) {
        this.getDimensions();
        this.mesh.position.set(this.offset.x, this.offset.y, 0);
        this.mesh.scale.set(this.sizes.x, this.sizes.y, 1);
        this.uniforms.uOffset.value.set(this.offset.x * 0.0, -(target - current) * 0.0003);

        const bounds = this.element.getBoundingClientRect();
        if (mousePosition.x >= bounds.left / window.innerWidth * 2 - 1 &&
            mousePosition.x <= (bounds.left + bounds.width) / window.innerWidth * 2 - 1 &&
            mousePosition.y <= -bounds.top / window.innerHeight * 2 + 1 &&
            mousePosition.y >= -(bounds.top + bounds.height) / window.innerHeight * 2 + 1) {
            // Set distortion based on how far the mouse is from the center of the image
            let distX = (mousePosition.x - this.offset.x / window.innerWidth) * bounds.width;
            let distY = (mousePosition.y + this.offset.y / window.innerHeight) * bounds.height;
            this.uniforms.uOffset.value.set(distX * 0.005, distY * 0.005);
        } else {
            this.uniforms.uOffset.value.set(0, 0);
        }
    }
}

init();
new EffectCanvas();
