import * as THREE from 'https://unpkg.com/three/build/three.module.js';

export function rgbToColor(r, g, b) {
    return new THREE.Color(r / 255, g / 255, b / 255);
}

export function createSphereFlags(length){
    var sphereCollisions = [];
    for (var i = 0; i < length; i++) {
        sphereCollisions[i] = false;
    }
    return sphereCollisions;
}
