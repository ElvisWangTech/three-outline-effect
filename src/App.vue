<script setup lang="ts">
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
// import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
// import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
// import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { OutlineComposor } from './outline/OutlineComposor'
import { onMounted, ref } from 'vue';
import OutlineChanger from './components/outline-changer/OutlineChanger.vue'
import UserControl from './components/control/UserControl.vue'
import { OutlineMode } from './types/index'
import { Object3D } from 'three';

let container = ref(),
  stats: Stats,
  camera: THREE.PerspectiveCamera,
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  controls: OrbitControls,
  composer: OutlineComposor | undefined,
  effectFXAA: ShaderPass,
  outlineComposor: OutlineComposor,
  sofa: Object3D,
  sofa2: Object3D,
  torus: Object3D,
  cabinet: Object3D,
  house: Object3D,
  mixer: THREE.AnimationMixer,
  action = ref<THREE.AnimationAction>();

const obj3d = new THREE.Object3D();
const group = new THREE.Group();
const floorGroup = new THREE.Group();
floorGroup.name = 'floorGroup'
floorGroup.visible = false;
floorGroup.position.y = -1.7;

const params = {
  edgeStrength: 3.0,
  edgeGlow: 0.0,
  edgeThickness: 1.0,
  pulsePeriod: 0,
  rotate: false,
  usePatternTexture: false
};

function init() {

  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer = new THREE.WebGLRenderer({ logarithmicDepthBuffer: true, preserveDrawingBuffer: true });
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.sortObjects = false;
  // 解决多个camera背景透明的问题, 属性的值设为false来阻止对应缓存被清除
  renderer.autoClearColor = true;
  // 定义渲染器是否在渲染每一帧之前自动清除深度缓存
  renderer.autoClearDepth = true;

  renderer.autoClearStencil = true;
  // 定义渲染器是否在渲染每一帧之前自动清除其输出
  renderer.autoClear = true;
  // GLTF模型需要
  // renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setSize(width, height);

  console.log('renderer: {autoClearColor} {autoClearDepth} {autoClearStencil}', renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil)

  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  scene.background = new THREE.Color(0x87CEFA);

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(20, 10, 40);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 2;
  controls.maxDistance = 800;
  controls.enablePan = true;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  //

  scene.add(new THREE.AmbientLight(0xaaaaaa, 1 * Math.PI));

  const light = new THREE.DirectionalLight(0xddffdd, 0.6 * Math.PI);
  light.position.set(1, 1, 1);
  light.castShadow = true;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;

  const d = 10;

  light.shadow.camera.left = - d;
  light.shadow.camera.right = d;
  light.shadow.camera.top = d;
  light.shadow.camera.bottom = - d;
  light.shadow.camera.far = 1000;

  scene.add(light);

  // model

  const manager = new THREE.LoadingManager();

  manager.onProgress = function (item, loaded, total) {

    console.log(item, loaded, total);

  };

  const loader = new GLTFLoader(manager);
  loader.load('/gltf/sofa/SM_单人沙发_80cm.gltf', function (object) {

    let scale = 1.0;

    sofa = object.scene;

    sofa.name = 'sofa'

    sofa.traverse(function (child) {

      if (child instanceof THREE.Mesh) {

        child.geometry.center();
        child.geometry.computeBoundingSphere();
        scale = 0.2 * child.geometry.boundingSphere.radius;

        child.receiveShadow = true;
        child.castShadow = true;

      }

    });

    sofa.position.y = -0.2;
    sofa.scale.divideScalar(scale);
    obj3d.add(sofa);

  });

  loader.load('/gltf/sofa/SM_双人沙发_160cm.gltf', function (object) {

    let scale = 1.0;

    sofa2 = object.scene;

    sofa2.name = 'sofa2'

    sofa2.traverse(function (child) {

      if (child instanceof THREE.Mesh) {

        child.geometry.center();
        child.geometry.computeBoundingSphere();
        scale = 0.2 * child.geometry.boundingSphere.radius;

        child.receiveShadow = true;
        child.castShadow = true;

      }

    });
    sofa2.position.y = -1.3
    sofa2.position.z = -10;
    sofa2.position.x = -1;
    sofa2.scale.divideScalar(scale);
    obj3d.add(sofa2);
  });

  loader.load('/gltf/cabinet/cabinet.glb', function(object) {
    let scale = 1.0;

    cabinet = object.scene;
    cabinet.name = 'cabinet'

    // 如果模型包含动画，可以使用 THREE.AnimationMixer 来播放
    mixer = new THREE.AnimationMixer(cabinet);
    action.value = mixer.clipAction(object.animations[0]); // 假设第一个 clip 是我们要播放的动画
    // action.value.play();

    cabinet.traverse(function (child) {

      if (child instanceof THREE.Mesh) {

        // child.geometry.center();
        // child.geometry.computeBoundingSphere();
        scale = 0.2

        child.receiveShadow = true;
        child.castShadow = true;

      }

    });

    cabinet.position.y = -1.4;
    cabinet.position.x = 10;
    cabinet.scale.divideScalar(scale);
    obj3d.add(cabinet);
  })

  loader.load('/gltf/house/house.glb', function(object) {
    house = object.scene;
    house.name = 'house'
    house.position.y = 5;
    house.position.x = 15;
    house.position.z = -10;
    house.scale.divideScalar(20);
    house.visible = false;
    obj3d.add(house);
  })

  scene.add(group);

  group.add(obj3d);

  const torusGeometry = new THREE.TorusGeometry(1, 0.3, 16, 100);
  const torusMaterial = new THREE.MeshPhongMaterial({ color: 0xffaaff });
  torus = new THREE.Mesh(torusGeometry, torusMaterial);
  torus.position.z = - 5;
  torus.position.y = 5
  group.add(torus);
  torus.receiveShadow = true;
  torus.castShadow = true;

  const floorMaterial = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, color: new THREE.Color(112, 112, 112) });

  const floorGeometry = new THREE.PlaneGeometry(1000, 1000);
  const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
  floorMesh.rotation.x -= Math.PI * 0.5;
  floorMesh.position.y -= 1.5;
  floorGroup.add(floorMesh);
  floorMesh.receiveShadow = true;

  const floorMaterial2 = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, color: new THREE.Color(0, 0, 0) });

  const floorGeometry2 = new THREE.PlaneGeometry(1000, 1000);
  const floorMesh2 = new THREE.Mesh(floorGeometry2, floorMaterial2);
  floorMesh2.rotation.x -= Math.PI * 0.5;
  floorMesh2.position.y -= 1.5001;
  floorGroup.add(floorMesh2);
  floorMesh2.receiveShadow = true;

  group.add(floorGroup)

  stats = new Stats();
  container.value.appendChild(stats.dom);

  outlineComposor = new OutlineComposor(renderer, camera, scene);
  outlineComposor.init()

  renderer.domElement.style.touchAction = 'none';
}

function changeOutlineMode(mode: OutlineMode) {
  if (mode === OutlineMode.Material) {
    if (composer) {
      composer.restoreObjs();
      composer.removeSurfaceIdAttribute([sofa, sofa2, torus, cabinet]);
    }
    composer = undefined;
    
  } else {
    composer = outlineComposor;
    // 只添加沙发模型
    composer.applyOutline([sofa, cabinet])
    composer.addSurfaceIdAttributeToMesh([sofa, sofa2, torus, cabinet])
  }
}

function animate() {

  requestAnimationFrame(animate);

  stats.begin();

  const timer = performance.now();

  if (params.rotate) {

    group.rotation.y = timer * 0.0001;

  }

  controls.update();

  mixer?.update(0.06);

  if (composer) {
    composer.render();
  } else {
    renderer.clear();
    renderer.render(scene, camera)
  }

  stats.end();

}

const toggleHouse = (visible: boolean) => {
  house.visible = visible
}

const toggleFloor = (visible: boolean) => {
  floorGroup.visible = visible
}

const toggleAnimation = (visible: boolean) => {
  if (visible) {
      action.value?.play()
    } else {
      action.value?.stop()
    }
}

onMounted(() => {
  init();
  animate();
  window.scene = scene;
  window.camera = camera
})
</script>

<template>
  <div ref="container">

  </div>
  <OutlineChanger @on-change="changeOutlineMode"/>
  <UserControl :action="action" 
    @toggle-house="toggleHouse" 
    @toggle-animation="toggleAnimation"
    @toggle-floor="toggleFloor"
  />
</template>
