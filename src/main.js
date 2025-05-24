import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, stencil: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Enhanced visual setup
scene.background = new THREE.Color(0x1a1a1a);
renderer.setClearColor(0x1a1a1a);
renderer.toneMapping = THREE.ACESFilmicToneMapping;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Environment map
const envTexture = new THREE.CubeTextureLoader()
  .setPath('https://threejs.org/examples/textures/cube/pisa/')
  .load(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']);
scene.environment = envTexture;

// Ground plane with better material
const groundGeometry = new THREE.PlaneGeometry(20, 20);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x303030,
  metalness: 0.3,
  roughness: 0.8
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Interactive objects with better materials
const objects = [];
const geometries = [
  new THREE.BoxGeometry(),
  new THREE.SphereGeometry(1, 32, 32),
  new THREE.ConeGeometry(1, 2, 32),
  new THREE.CylinderGeometry(1, 1, 2, 32),
  new THREE.TorusGeometry(1, 0.4, 32, 100)
];

geometries.forEach((geom, i) => {
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
    metalness: 0.4,
    roughness: 0.2,
    envMap: envTexture
  });
  
  const mesh = new THREE.Mesh(geom, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set((i - 2) * 3, 1, 0);
  mesh.userData.originalScale = mesh.scale.clone();
  scene.add(mesh);
  objects.push(mesh);
});

// Camera setup
camera.position.set(0, 15, 25);
camera.lookAt(0, 0, 0);

// Enhanced OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Highlight material with outline effect
const outlineSettings = {
  color: 0xffaa00,
  thickness: 0.1
};

const outlineMaterial = new THREE.MeshBasicMaterial({
  color: outlineSettings.color,
  stencilWrite: true,
  stencilFunc: THREE.NotEqualStencilFunc,
  stencilRef: 1,
  side: THREE.BackSide
});

// Interactive GUI
const gui = new GUI();
gui.addColor(outlineSettings, 'color').onChange(value => {
  outlineMaterial.color.set(value);
});
gui.add(outlineSettings, 'thickness', 0.05, 0.3).name('Outline Thickness');

// Hover effect
const hoverMaterial = new THREE.MeshBasicMaterial({ 
  color: 0xffffff,
  transparent: true,
  opacity: 0.3
});

let hoveredObject = null;

// Enhanced raycasting
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedObject = null;

// UI Elements
const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.top = '20px';
scoreElement.style.left = '20px';
scoreElement.style.color = 'white';
scoreElement.style.fontFamily = 'Arial';
scoreElement.style.fontSize = '24px';
document.body.appendChild(scoreElement);

let score = 0;

function updateScore() {
  scoreElement.textContent = `Score: ${score}`;
}

// Interaction handlers
window.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(objects);

  if (intersects.length > 0) {
    const obj = intersects[0].object;
    if (hoveredObject !== obj) {
      if (hoveredObject) {
        hoveredObject.material.emissive.setHex(hoveredObject.userData.originalEmissive);
        hoveredObject.scale.copy(hoveredObject.userData.originalScale);
      }
      hoveredObject = obj;
      obj.userData.originalEmissive = obj.material.emissive.getHex();
      obj.material.emissive.setHex(0x888888);
      obj.scale.multiplyScalar(1.1);
    }
  } else if (hoveredObject) {
    hoveredObject.material.emissive.setHex(hoveredObject.userData.originalEmissive);
    hoveredObject.scale.copy(hoveredObject.userData.originalScale);
    hoveredObject = null;
  }
});

window.addEventListener('click', (e) => {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(objects);

  if (intersects.length > 0) {
    const clickedObj = intersects[0].object;
    
    if (selectedObject) {
      selectedObject.material = selectedObject.userData.originalMaterial;
      selectedObject.scale.copy(selectedObject.userData.originalScale);
    }

    selectedObject = clickedObj;
    clickedObj.userData.originalMaterial = clickedObj.material;
    clickedObj.material = outlineMaterial;
    clickedObj.scale.multiplyScalar(1 + outlineSettings.thickness);
    
    score += 10;
    updateScore();
    
    // Add particle effect
    const particles = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i < 100; i++) {
      positions.push(
        clickedObj.position.x + (Math.random() - 0.5),
        clickedObj.position.y + (Math.random() - 0.5),
        clickedObj.position.z + (Math.random() - 0.5)
      );
    }
    particles.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const particleSystem = new THREE.Points(
      particles,
      new THREE.PointsMaterial({ color: outlineSettings.color, size: 0.1 })
    );
    scene.add(particleSystem);
    
    setTimeout(() => scene.remove(particleSystem), 500);
  }
});

// Animation loop with camera movement
function animate() {
  requestAnimationFrame(animate);
  
  // Auto-rotate when not interacting
  if (!controls.enabled) {
    camera.position.x = Math.sin(Date.now() * 0.001) * 25;
    camera.position.z = Math.cos(Date.now() * 0.001) * 25;
    camera.lookAt(0, 0, 0);
  }
  
  controls.update();
  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();