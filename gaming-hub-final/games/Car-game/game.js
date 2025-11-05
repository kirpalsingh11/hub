import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

let extraEnemies = [];
let enemySpeedMultiplier = 1;
let driveSpeedMultiplier = 1;
const baseEnemySpeed = 0.6; // base enemy speed
let scene, camera, renderer, carModel, enemyCar;
let ambientLight, directionalLight;
let road, roadLines = [], kerbs = [];
let buildings = [], streetLights = [], trafficLights = [];
const roadWidth = 10;
const roadLength = 200;
const sceneryRecycleDistance = roadLength / 2;
const buildingSpacing = 15;
const lightSpacing = 30;
const numBuildings = Math.floor(roadLength * 1.5 / buildingSpacing);
const numLights = Math.floor(roadLength * 1.5 / lightSpacing);

const driveSpeed = 0.5;
const enemyCarSpeed = 0.6;

const kerbHeight = 0.2;
const kerbWidth = 0.3;

let moveLeft = false;
let moveRight = false;
const carMoveSpeed = 0.15;
let carBaseY = 0;
let score = 0;
let isGameOver = false;

const points = [];
const numPoints = 15;
const pointValue = 10;
let pointGeometry, pointMaterial;
const pointRadius = 0.3;

const loadingScreen = document.getElementById('loading-screen');
const loadingProgress = document.getElementById('loading-progress');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');
const restartButton = document.getElementById('restart-button');

let playerBox = new THREE.Box3();
let enemyBox = new THREE.Box3();
let pointBox = new THREE.Box3();

const loadingManager = new THREE.LoadingManager();

loadingManager.onLoad = () => {
    console.log("All resources loaded!");
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (!isGameOver) animate();
    }, 600);
};
loadingManager.onError = (url) => {
    console.error(`Error loading ${url}`);
    loadingScreen.textContent = `Error loading: ${url}. Check console.`;
    loadingScreen.classList.remove('hidden');
    loadingScreen.style.opacity = 1;
};
loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progress = Math.round((itemsLoaded / itemsTotal) * 100);
    loadingProgress.textContent = `${progress}%`;
};

init();
setupControls();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0d7e6);
    scene.fog = new THREE.Fog(0xa0d7e6, roadLength * 0.4, roadLength * 0.9);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, -7);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    document.getElementById('container').appendChild(renderer.domElement);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);
    scene.add(directionalLight.target);

    const hdrPath = 'https://threejs.org/examples/textures/equirectangular/';
    const hdrName = 'venice_sunset_1k.hdr';
    new RGBELoader(loadingManager)
        .setPath(hdrPath)
        .load(hdrName, (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = texture;
            scene.background = texture;
        }, undefined, (error) => {
            console.error('HDRI loading error:', error);
            scene.background = new THREE.Color(0xa0d7e6);
        });

    const groundGeo = new THREE.PlaneGeometry(roadWidth * 5, roadLength * 1.5);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x55aa55, side: THREE.DoubleSide, roughness: 0.9, metalness: 0.1 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength * 1.5);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, metalness: 0.1 });
    road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.0;
    road.receiveShadow = true;
    scene.add(road);

    const lineLength = 4, lineGap = 4;
    const numLines = Math.floor(roadLength * 1.5 / (lineLength + lineGap));
    const lineGeo = new THREE.PlaneGeometry(0.3, lineLength);
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.2 });
    for (let i = 0; i < numLines; i++) {
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.y = 0.005;
        line.position.z = (roadLength * 1.5 / 2) - (lineLength / 2) - i * (lineLength + lineGap);
        line.receiveShadow = true;
        roadLines.push(line);
        scene.add(line);
    }

    const kerbTexture = createKerbTexture();
    kerbTexture.wrapS = THREE.RepeatWrapping;
    kerbTexture.wrapT = THREE.ClampToEdgeWrapping;
    kerbTexture.repeat.set(roadLength * 1.5 / 4, 1);
    const kerbGeo = new THREE.BoxGeometry(kerbWidth, kerbHeight, roadLength * 1.5);
    const kerbMat = new THREE.MeshStandardMaterial({ map: kerbTexture, roughness: 0.7, metalness: 0.1 });

    const kerbLeft = new THREE.Mesh(kerbGeo, kerbMat);
    kerbLeft.position.set(-(roadWidth / 2) - (kerbWidth / 2), kerbHeight / 2, 0);
    kerbLeft.castShadow = true; kerbLeft.receiveShadow = true;
    scene.add(kerbLeft); kerbs.push(kerbLeft);

    const kerbRight = new THREE.Mesh(kerbGeo, kerbMat);
    kerbRight.position.set((roadWidth / 2) + (kerbWidth / 2), kerbHeight / 2, 0);
    kerbRight.castShadow = true; kerbRight.receiveShadow = true;
    scene.add(kerbRight); kerbs.push(kerbRight);

    for (let i = 0; i < numBuildings; i++) {
        const buildingLeft = createBuilding(), buildingRight = createBuilding();
        const zPos = (roadLength * 1.5 / 2) - (buildingSpacing / 2) - i * buildingSpacing;
        const xOffsetLeft = roadWidth / 2 + kerbWidth + 1 + Math.random() * 5 + buildingLeft.geometry.parameters.width / 2;
        const xOffsetRight = roadWidth / 2 + kerbWidth + 1 + Math.random() * 5 + buildingRight.geometry.parameters.width / 2;
        buildingLeft.position.set(-xOffsetLeft, buildingLeft.geometry.parameters.height / 2, zPos);
        buildingRight.position.set(xOffsetRight, buildingRight.geometry.parameters.height / 2, zPos);
        buildings.push(buildingLeft, buildingRight);
        scene.add(buildingLeft); scene.add(buildingRight);
    }

    for (let i = 0; i < numLights; i++) {
        const lightLeft = createStreetLight(), lightRight = createStreetLight();
        const zPos = (roadLength * 1.5 / 2) - (lightSpacing / 2) - i * lightSpacing;
        const xPos = roadWidth / 2 + kerbWidth + 0.8;

        lightLeft.position.set(-xPos, 0, zPos); lightLeft.rotation.y = Math.PI / 2;
        lightLeft.children[1].position.x = -lightLeft.userData.armLength / 2;
        lightLeft.children[2].position.x = -lightLeft.userData.armLength;
        streetLights.push(lightLeft); scene.add(lightLeft);

        lightRight.position.set(xPos, 0, zPos); lightRight.rotation.y = -Math.PI / 2;
        lightRight.children[1].position.x = -lightRight.userData.armLength / 2;
        lightRight.children[2].position.x = -lightRight.userData.armLength;
        streetLights.push(lightRight); scene.add(lightRight);
    }

    const trafficLightLeft = createTrafficLight(), trafficLightRight = createTrafficLight();
    const trafficLightZ = roadLength * 0.4, trafficLightX = roadWidth / 2 + kerbWidth + 0.5;
    trafficLightLeft.position.set(-trafficLightX, 0, trafficLightZ); trafficLightLeft.rotation.y = Math.PI;
    trafficLightRight.position.set(trafficLightX, 0, trafficLightZ); trafficLightRight.rotation.y = -Math.PI;
    trafficLights.push(trafficLightLeft, trafficLightRight);
    scene.add(trafficLightLeft); scene.add(trafficLightRight);

    pointGeometry = new THREE.SphereGeometry(pointRadius, 16, 16);
    pointMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xaaaa00, emissiveIntensity: 0.8, metalness: 0.9, roughness: 0.1 });
    for (let i = 0; i < numPoints; i++) {
        const point = new THREE.Mesh(pointGeometry, pointMaterial);
        point.castShadow = true; point.receiveShadow = true;
        resetPointPosition(point, true);
        points.push(point); scene.add(point);
    }

    const loader = new GLTFLoader(loadingManager);
    const dracoLoader = new DRACOLoader(loadingManager);
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    loader.setDRACOLoader(dracoLoader);
    const carUrl = 'https://threejs.org/examples/models/gltf/ferrari.glb';

    loader.load(carUrl, (gltf) => {
        carModel = gltf.scene; carModel.scale.set(0.8, 0.8, 0.8);
        const box = new THREE.Box3().setFromObject(carModel);
        carBaseY = -box.min.y + 0.01;
        carModel.position.set(0, carBaseY, 0);
        carModel.rotation.y = Math.PI;
        carModel.traverse((node) => { if (node.isMesh) { node.castShadow = node.receiveShadow = true; } });
        scene.add(carModel);

        enemyCar = carModel.clone();
        enemyCar.traverse(node => { if (node.isMesh) { const mat = node.material.clone(); mat.color.setHex(0x0000ff); mat.metalness = 0.9; mat.roughness = 0.2; node.material = mat; } });
        const initialEnemyX = (Math.random() < 0.5 ? -1 : 1) * roadWidth / 4;
        enemyCar.position.set(initialEnemyX, carBaseY, roadLength * 0.7);
        enemyCar.rotation.y = Math.PI;
        scene.add(enemyCar);

        camera.position.set(0, carBaseY + 3, -7);
        camera.lookAt(carModel.position.x, carBaseY + 1, carModel.position.z + 5);
    }, undefined, (error) => {
        console.error('Error loading car:', error);
        const fallbackGeo = new THREE.BoxGeometry(2, 1, 4);
        const fallbackMat = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.5, metalness: 0.5 });
        carModel = new THREE.Mesh(fallbackGeo, fallbackMat);
        carBaseY = 0.51;
        carModel.position.set(0, carBaseY, 0); carModel.castShadow = carModel.receiveShadow = true;
        scene.add(carModel);

        enemyCar = new THREE.Mesh(fallbackGeo, new THREE.MeshStandardMaterial({ color: 0x0000ff, roughness: 0.5, metalness: 0.5 }));
        enemyCar.position.set(roadWidth / 4, carBaseY, roadLength * 0.7);
        enemyCar.castShadow = enemyCar.receiveShadow = true;
        scene.add(enemyCar);

        camera.position.set(0, carBaseY + 3, -7);
        camera.lookAt(carModel.position.x, carBaseY + 1, carModel.position.z + 5);
        loadingScreen.textContent = 'Error loading car model. Displaying fallback.';
        loadingScreen.classList.remove('hidden'); loadingScreen.style.opacity = 1;
    });

    restartButton.addEventListener('click', restartGame);
    window.addEventListener('resize', onWindowResize, false);
    updateScoreDisplay();
}

function setupControls() {
    window.addEventListener('keydown', (e) => {
        if (isGameOver) return;
        // Swap directions here
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') moveRight = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') moveLeft = true;
    });
    window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') moveRight = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') moveLeft = false;
    });

    const leftButton = document.getElementById('left-button');
    const rightButton = document.getElementById('right-button');

    leftButton.addEventListener('pointerdown', () => { if (!isGameOver) moveRight = true; });
    leftButton.addEventListener('pointerup', () => { moveRight = false; });
    rightButton.addEventListener('pointerdown', () => { if (!isGameOver) moveLeft = true; });
    rightButton.addEventListener('pointerup', () => { moveLeft = false; });
}


function animate() {
    if (isGameOver) return;
    requestAnimationFrame(animate);

    updatePlayer();
    updateEnemy();
    updateExtraEnemies();
    updatePoints();
    updateScenery();
    updateDifficulty();

    renderer.render(scene, camera);
}

function updatePlayer() {
    if (!carModel) return;
    if (moveLeft) carModel.position.x -= carMoveSpeed;
    if (moveRight) carModel.position.x += carMoveSpeed;
    const halfRoad = roadWidth / 2 - 1; carModel.position.x = Math.max(-halfRoad, Math.min(halfRoad, carModel.position.x));
    camera.position.x += (carModel.position.x - camera.position.x) * 0.1;
    camera.position.z = carModel.position.z - 7; camera.position.y = carBaseY + 3;
    camera.lookAt(carModel.position.x, carBaseY + 1, carModel.position.z + 5);
    playerBox.setFromObject(carModel);
}

function updateEnemy() {
    if (!enemyCar) return;
    enemyCar.position.z -= (baseEnemySpeed * enemySpeedMultiplier);
    if (enemyCar.position.z < -roadLength * 0.75) {
        enemyCar.position.z = roadLength * 0.75;
        enemyCar.position.x = (Math.random() < 0.5 ? -1 : 1) * (roadWidth / 4);
    }
    enemyBox.setFromObject(enemyCar);
    if (playerBox.clone().expandByScalar(0.3).intersectsBox(enemyBox)) endGame();
}

function updateExtraEnemies() {
    extraEnemies.forEach(enemy => {
        enemy.position.z -= (baseEnemySpeed * enemySpeedMultiplier);
        if (enemy.position.z < -roadLength * 0.75) {
            enemy.position.z = roadLength * 0.75;
            enemy.position.x = (Math.random() < 0.5 ? -1 : 1) * (roadWidth / 4);
        }
        enemyBox.setFromObject(enemy);
        if (playerBox.clone().expandByScalar(0.3).intersectsBox(enemyBox)) endGame();
    });
}

function updatePoints() {
    points.forEach(point => {
        point.position.z -= (driveSpeed * driveSpeedMultiplier);
        if (point.position.z < -roadLength * 0.75) resetPointPosition(point);
        pointBox.setFromObject(point);
        if (playerBox.intersectsBox(pointBox)) {
            score += pointValue; updateScoreDisplay();
            resetPointPosition(point);
        }
    });
}

function updateScenery() {
    road.position.z -= (driveSpeed * driveSpeedMultiplier);
    if (road.position.z < -roadLength * 0.75) road.position.z = 0;

    roadLines.forEach(line => {
        line.position.z -= (driveSpeed * driveSpeedMultiplier);
        if (line.position.z < -roadLength * 0.75) line.position.z += roadLength * 1.5;
    });

    kerbs.forEach(kerb => {
        kerb.position.z -= (driveSpeed * driveSpeedMultiplier);
        if (kerb.position.z < -roadLength * 0.75) kerb.position.z += roadLength * 1.5;
    });

    buildings.forEach(building => {
        building.position.z -= (driveSpeed * driveSpeedMultiplier);
        if (building.position.z < -roadLength * 0.75) building.position.z += buildingSpacing * numBuildings;
    });

    streetLights.forEach(light => {
        light.position.z -= (driveSpeed * driveSpeedMultiplier);
        if (light.position.z < -roadLength * 0.75) light.position.z += lightSpacing * numLights;
    });

    trafficLights.forEach(light => {
        light.position.z -= (driveSpeed * driveSpeedMultiplier);
        if (light.position.z < -roadLength * 0.75) light.position.z += roadLength * 1.5;
    });
}
function updateDifficulty() {
    // Increase speeds as score grows
    enemySpeedMultiplier = 0.5 + score / 200;
    driveSpeedMultiplier = 0.5 + score / 400;

    // Only allow 1 extra enemy at a time
    if (score >= 50 && extraEnemies.length < 1) {
        const enemy = enemyCar.clone();
        enemy.traverse(node => {
            if (node.isMesh) {
                const mat = node.material.clone();
                mat.color.setHex(0xff00ff); // extra enemy color
                node.material = mat;
            }
        });

        // Weighted lane choice: -1=left, 0=middle, 1=right
        const lanes = [-1, 0, 1];
        const weights = lanes.map(lane => lane === 0 ? 2 + score / 500 : 1);
        const sum = weights.reduce((a, b) => a + b, 0);
        const rand = Math.random() * sum;
        let cum = 0;
        let chosenLane = 0;
        for (let i = 0; i < lanes.length; i++) {
            cum += weights[i];
            if (rand <= cum) {
                chosenLane = lanes[i];
                break;
            }
        }

        const xPos = chosenLane * (roadWidth / 2 - kerbWidth - 1);
        enemy.position.set(xPos, carBaseY, roadLength * 0.7);
        enemy.rotation.y = Math.PI;

        scene.add(enemy);
        extraEnemies.push(enemy);
    }
}


function resetPointPosition(point, initial = false) {
    point.position.x = (Math.random() - 0.5) * (roadWidth - 2);
    point.position.y = carBaseY + 0.5;
    point.position.z = initial ? Math.random() * roadLength * 0.7 : roadLength * 0.75 + Math.random() * 10;
}

function updateScoreDisplay() { scoreElement.textContent = `Score: ${score}`; }

function endGame() { isGameOver = true; gameOverElement.style.display = 'flex'; }

function restartGame() {
    score = 0; isGameOver = false; updateScoreDisplay();
    carModel.position.set(0, carBaseY, 0);
    enemyCar.position.set((Math.random() < 0.5 ? -1 : 1) * (roadWidth / 4), carBaseY, roadLength * 0.7);
    extraEnemies.forEach(enemy => scene.remove(enemy)); extraEnemies = [];
    points.forEach(point => resetPointPosition(point, true));
    gameOverElement.style.display = 'none';
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function createKerbTexture() {
    const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, 16, 16); ctx.fillRect(16, 16, 16, 16);
    return new THREE.CanvasTexture(canvas);
}

function createBuilding() {
    const width = 3 + Math.random() * 4, height = 5 + Math.random() * 10, depth = 3 + Math.random() * 4;
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const color = new THREE.Color(`hsl(${Math.random() * 360}, 30%, 50%)`);
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = mesh.receiveShadow = true;
    return mesh;
}

function createStreetLight() {
    const poleHeight = 5 + Math.random() * 3, armLength = 3 + Math.random() * 2;
    const group = new THREE.Group(); group.userData.armLength = armLength;
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, poleHeight, 6);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.7 });
    const pole = new THREE.Mesh(poleGeo, poleMat); pole.castShadow = pole.receiveShadow = true;
    pole.position.y = poleHeight / 2; group.add(pole);
    const armGeo = new THREE.BoxGeometry(armLength, 0.1, 0.1);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const arm = new THREE.Mesh(armGeo, armMat); arm.position.y = poleHeight; arm.castShadow = arm.receiveShadow = true;
    group.add(arm);
    const lightGeo = new THREE.SphereGeometry(0.3, 16, 16); const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 0.8 });
    const light = new THREE.Mesh(lightGeo, lightMat); light.position.set(armLength, poleHeight, 0); group.add(light);
    return group;
}

function createTrafficLight() {
    const poleHeight = 3, group = new THREE.Group();
    const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, poleHeight, 6); const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const pole = new THREE.Mesh(poleGeo, poleMat); pole.position.y = poleHeight / 2; group.add(pole);
    const lightRadius = 0.2, spacing = 0.25;
    const colors = [0xff0000, 0xffff00, 0x00ff00];
    colors.forEach((c, i) => {
        const lightGeo = new THREE.SphereGeometry(lightRadius, 12, 12);
        const lightMat = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.8 });
        const light = new THREE.Mesh(lightGeo, lightMat); light.position.y = poleHeight - i * spacing - 0.3; group.add(light);
    });
    return group;
}
