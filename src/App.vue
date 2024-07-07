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
  // outlinePass: OutlinePass,
  outlineComposor: OutlineComposor,
  sofa: Object3D;

// let selectedObjects: THREE.Object3D[] = [];

// const raycaster = new THREE.Raycaster();
// const mouse = new THREE.Vector2();

const obj3d = new THREE.Object3D();
const group = new THREE.Group();

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
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setSize(width, height);

  console.log('renderer: {autoClearColor} {autoClearDepth} {autoClearStencil}', renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil)

  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 40, 80);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 5;
  controls.maxDistance = 20;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  //

  scene.add(new THREE.AmbientLight(0xaaaaaa, 1));

  const light = new THREE.DirectionalLight(0xddffdd, 0.6);
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

  // const loader = new OBJLoader( manager );
  const loader = new GLTFLoader(manager);
  loader.load('/gltf/sofa/SM_单人沙发_80cm.gltf', function (object) {

    let scale = 1.0;

    sofa = object.scene;

    sofa.traverse(function (child) {

      if (child instanceof THREE.Mesh) {

        child.geometry.center();
        child.geometry.computeBoundingSphere();
        scale = 0.2 * child.geometry.boundingSphere.radius;

        // const phongMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x111111, shininess: 5 } );
        // child.material = phongMaterial;
        child.receiveShadow = true;
        child.castShadow = true;

      }

    });

    sofa.position.y = 1.5;
    sofa.scale.divideScalar(scale);
    obj3d.add(sofa);

  });

  scene.add(group);

  group.add(obj3d);

  //

  // const geometry = new THREE.SphereGeometry( 3, 48, 24 );

  // for ( let i = 0; i < 20; i ++ ) {

  // 	const material = new THREE.MeshLambertMaterial();
  // 	material.color.setHSL( Math.random(), 1.0, 0.3 );

  // 	const mesh = new THREE.Mesh( geometry, material );
  // 	mesh.position.x = Math.random() * 4 - 2;
  // 	mesh.position.y = Math.random() * 4 - 2;
  // 	mesh.position.z = Math.random() * 4 - 2;
  // 	mesh.receiveShadow = true;
  // 	mesh.castShadow = true;
  // 	mesh.scale.multiplyScalar( Math.random() * 0.3 + 0.1 );
  // 	group.add( mesh );

  // }

  // const floorMaterial = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, color: new THREE.Color(198, 183, 186) });

  // const floorGeometry = new THREE.PlaneGeometry(500, 500);
  // const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
  // floorMesh.rotation.x -= Math.PI * 0.5;
  // floorMesh.position.y -= 1.5;
  // group.add(floorMesh);
  // floorMesh.receiveShadow = true;

  const torusGeometry = new THREE.TorusGeometry(1, 0.3, 16, 100);
  const torusMaterial = new THREE.MeshPhongMaterial({ color: 0xffaaff });
  const torus = new THREE.Mesh(torusGeometry, torusMaterial);
  torus.position.z = - 5;
  torus.position.y = 5
  group.add(torus);
  torus.receiveShadow = true;
  torus.castShadow = true;

  //

  stats = Stats();
  container.value.appendChild(stats.dom);

  // #region postprocessing

  // composer = new EffectComposer(renderer);
  // const renderPass = new RenderPass(scene, camera);
  // composer.addPass(renderPass);
  // outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
  // composer.addPass(outlinePass);
  // effectFXAA = new ShaderPass(FXAAShader);
  // effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
  // composer.addPass(effectFXAA);

  outlineComposor = new OutlineComposor(renderer, camera, scene);
  outlineComposor.init()


  // #endregion

  // window.addEventListener('resize', onWindowResize);

  renderer.domElement.style.touchAction = 'none';
  // renderer.domElement.addEventListener('pointerup', onPointerMove);

  // function onPointerMove(event: { isPrimary: boolean; clientX: number; clientY: number; }) {

  //   if (event.isPrimary === false) return;

  //   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  //   mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  //   checkIntersection();

  // }

  // function addSelectedObject(object: THREE.Object3D<THREE.Event>) {

  //   selectedObjects = [];
  //   selectedObjects.push(object);

  // }

  // function checkIntersection() {

  //   raycaster.setFromCamera(mouse, camera);

  //   const intersects = raycaster.intersectObject(scene, true);

  //   if (intersects.length > 0) {

  //     const selectedObject = intersects[0].object;
  //     addSelectedObject(selectedObject);
  //     // outlinePass.selectedObjects = selectedObjects;
  //     outlineComposor.addSurfaceIdAttributeToMesh(selectedObjects)

  //   } else {

  //     // outlinePass.selectedObjects = [];
  //     outlineComposor.restoreObjs();

  //   }

  // }

}

function changeOutlineMode(mode: OutlineMode) {
  if (mode === OutlineMode.Material) {
    if (composer) {
      composer.restoreObjs();
    }
    composer = undefined;
    
  } else {
    composer = outlineComposor;
    // 只添加沙发模型
    composer.applyOutline([sofa])
  }
}

// function onWindowResize() {

//   const width = window.innerWidth;
//   const height = window.innerHeight;

//   camera.aspect = width / height;
//   camera.updateProjectionMatrix();

//   renderer.setSize(width, height);
//   composer?.setSize(width, height);

//   effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);

// }

function animate() {

  requestAnimationFrame(animate);

  stats.begin();

  const timer = performance.now();

  if (params.rotate) {

    group.rotation.y = timer * 0.0001;

  }

  controls.update();

  if (composer) {
    composer.render();
  } else {
    renderer.clear();
    renderer.render(scene, camera)
  }

  stats.end();

}

onMounted(() => {
  init();
  animate();
})
</script>

<template>
  <div ref="container">

  </div>
  <OutlineChanger @on-change="changeOutlineMode"/>
</template>
