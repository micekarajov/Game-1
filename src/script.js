import * as THREE from 'https://unpkg.com/three/build/three.module.js';
import {rgbToColor, createSphereFlags} from "./helpers.js";

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xADD8E6);

// Scene Fog
// scene.fog = new THREE.FogExp2(0xFFFFFF, 0.05);

// Camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000 );
camera.position.set(0, 3, 5);
camera.lookAt(scene.position);

// Light 
const light = new THREE.DirectionalLight(0xffffff, 1);
scene.add(light);
light.position.set(50, 50, 0);
light.castShadow = true; 
light.shadow.mapSize.width = 1024; 
light.shadow.mapSize.height = 1024;

// const dLightHelper = new THREE.DirectionalLightHelper(light, 5);
// scene.add(dLightHelper);

// Render
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
renderer.render(scene, camera); 
renderer.shadowMap.enabled = true;
document.body.appendChild( renderer.domElement );

//Plane Ground
var planeGeometry = new THREE.PlaneGeometry(5, 50, 1, 1);
var planeMaterial = new THREE.MeshStandardMaterial({ color: 0x00FFFF, side: THREE.DoubleSide });
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.receiveShadow = true; // enable shadow receiving on the ground
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

//Cube
let cube, cubePosition;
var cubeGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
var cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xD3D3D3 });
cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.castShadow = true;
scene.add(cube);
cubePosition = new THREE.Vector3(0, 0.25, 3.5);
cube.position.copy(cubePosition);

// Set up the sphere
const colors = [0xff0000, 0x00FF00];
const spheres = [];
const minX = -2;
const maxX = 2;
const minY = -15;
const maxY = 1;
const radius = 1;

for (let i = 0; i < 35; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    let sphereGeometry = new THREE.SphereGeometry(0.2, 32, 32);
    let sphereMaterial = new THREE.MeshPhongMaterial({ color });
    let sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    let x = minX + (maxX - minX) * Math.random();
    let y = minY + (maxY - minY) * Math.random();
    let spherePosition = new THREE.Vector3(x, 0.2, y);
    sphere.position.copy(spherePosition);
    sphere.castShadow = true;
    scene.add(sphere);

    // check if the new sphere collides with any of the existing spheres
    let isColliding = false;
    for (let j = 0; j < spheres.length; j++) {
        const otherSphere = spheres[j];
        const distance = sphere.position.distanceTo(otherSphere.position);
        if (distance < radius + otherSphere.geometry.parameters.radius) {
            isColliding = true;
            break;
        }
    }

    if (isColliding) {
        scene.remove(sphere);
        i--;
        continue;
    }
    spheres.push(sphere);
}

const cubeBox = new THREE.Box3().setFromObject(cube);
let collisionCount = 0;
let isAnimating = true;
let sphereCollisions = createSphereFlags(spheres.length);
let animationId;

function moveDown()
{ 
    for (let i = 0; i < spheres.length; i++) {
        spheres[i].position.z += 0.02; 
        renderer.setAnimationLoop(moveDown);
    }

    const particlesBox = new THREE.Box3(
        new THREE.Vector3(-5, 0, -5),
        new THREE.Vector3(5, 10, 5)
    ); 
               
    cubeBox.setFromObject(cube);
               
    for (let i = 0; i < spheres.length; i++) {
        const sphereBox = new THREE.Box3().setFromObject(spheres[i]);
        sphereBox.setFromObject(spheres[i]);

        let intersects = cubeBox.intersectsBox(sphereBox);
                   
        if (intersects && !sphereCollisions[i] && isAnimating ) {
            const sphereCenter = sphereBox.getCenter(new THREE.Vector3());
            const collisionPoint = sphereCenter.clone().sub(cube.position);
                        
            if (spheres[i].material.color.getHex() === 0x00FF00){
                collisionCount++;
                scene.remove(spheres[i]);
                cube.material.color.setHex(0x00FF00);
                addParticles(collisionPoint, rgbToColor(0, 255, 0), particlesBox);                            
            }

            if (spheres[i].material.color.getHex() === 0xff0000){
                collisionCount--;
                scene.remove(spheres[i]);
                cube.material.color.setHex(0xff0000);
                addParticles(collisionPoint,  rgbToColor(255, 0, 0), particlesBox);
            }
            sphereCollisions[i] = true;
            scoreCount.innerText=collisionCount;
        }
    }
}

function addParticles(collisionPoint, color, box){
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);


for (let i = 0; i < particleCount; i++) {
    const x = collisionPoint.x + Math.random() * (box.max.x - box.min.x) + box.min.x;
    const y = collisionPoint.y + Math.random() * (box.max.y - box.min.y) + box.min.y;
    const z = collisionPoint.z + Math.random() * (box.max.z - box.min.z) + box.min.z;
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
particleGeometry.computeBoundingSphere();

const particleMaterial = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    transparent: true,
    opacity: 0.5
});

const particles = new THREE.Points(particleGeometry, particleMaterial);
particles.position.copy(collisionPoint);
scene.add(particles);

// remove particles after 1 second
setTimeout(() => {
    scene.remove(particles);
    }, 1000);
}
            
function onKeyDown(event) {
    switch (event.keyCode) {
        case 37: // left
        cubePosition.x -= 0.1;
        break;
        case 39: // right
        cubePosition.x += 0.1;
        break;
    }
}
           
document.addEventListener('keydown', onKeyDown, false);
document.getElementById("startBtn").addEventListener("click", moveDown, false);
document.getElementById("startBtn").addEventListener("click", startTimer);
//document.getElementById("stopBtn").addEventListener("click", stopTimer);
document.getElementById("continueBtn").addEventListener("click", continueTimer);
const scoreCount = document.getElementById("score");
            
let seconds = 0;
let minutes = 0;
let hours = 0;
let timerInterval;

function startTimer() {
    document.getElementById("startBtn").style.display = "none";
    timerInterval = setInterval(function() {
        seconds++;
        if (seconds === 60) {
            seconds = 0;
            minutes++;
        }
        if (minutes === 60) {
            minutes = 0;
            hours++;
        }
        document.getElementById("timer").innerHTML =
            pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
        if(seconds == 10){
            stopTimer();
        document.getElementById("continueBtn").style.display = "inline";
        }
        if(seconds == 15){
            stopTimer();
            document.getElementById("continueBtn").style.display = "none";
            document.getElementById("end").style.display = "inline";
        }
    }, 1000);
}

function stopTimer() {
    cancelAnimationFrame(animationId);
    clearInterval(timerInterval);
    isAnimating = false;
}

function continueTimer() {
    animate();
    startTimer();
    isAnimating = true;
    document.getElementById("continueBtn").style.display = "none";
}

function pad(number) {
    return number < 10 ? "0" + number : number;
}
            
            
function animate() {
    animationId = requestAnimationFrame( animate );
    cube.position.copy(cubePosition)
	renderer.render( scene, camera );
}

animate();
document.body.appendChild(renderer.domElement);
           