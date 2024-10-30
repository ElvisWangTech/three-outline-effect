import { AmbientLight, AnimationAction, AnimationMixer, Color, DirectionalLight, DoubleSide, Group, LoadingManager, Mesh, MeshLambertMaterial, MeshPhongMaterial, Object3D, PerspectiveCamera, PlaneGeometry, Scene, SRGBColorSpace, TorusGeometry, WebGLRenderer } from "three";
import { GLTFLoader, OrbitControls } from "three/examples/jsm/Addons.js";
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { ref } from "vue";
import { OutlineComposor } from "../../outline/OutlineComposor";

export interface ISceneMembers {
  stats: Stats,
  camera: PerspectiveCamera,
  scene: Scene,
  renderer: WebGLRenderer,
  controls?: OrbitControls,
  sofa: Object3D,
  sofa2: Object3D,
  torus: Object3D,
  cabinet: Object3D,
  cabinetBk: Object3D,
  house: Object3D,
  mixer?: AnimationMixer,
  action?: AnimationAction,
  obj3d: Object3D,
  rootGroup: Group,
  floorGroup: Group,
  composer?: OutlineComposor
}

export const useSceneLoader = () => {
  const container = ref();
  const sceneMembers: ISceneMembers = {
    stats: new Stats,
    camera: new PerspectiveCamera,
    scene: new Scene,
    renderer: new WebGLRenderer,
    controls: undefined,
    sofa: new Object3D,
    sofa2: new Object3D,
    torus: new Object3D,
    cabinet: new Object3D,
    cabinetBk: new Object3D,
    house: new Object3D,
    mixer: undefined,
    action: undefined,
    obj3d: new Object3D,
    rootGroup: new Group,
    floorGroup: new Group
  }

  function init() {

    const width = window.innerWidth;
    const height = window.innerHeight;

    const obj3d = new Object3D();
    obj3d.name = 'obj3d'
    sceneMembers.obj3d = obj3d
    const group = new Group();
    group.name = 'rootGroup'
    sceneMembers.rootGroup = group
    const floorGroup = new Group();
    floorGroup.name = 'floorGroup'
    floorGroup.visible = false;
    floorGroup.position.y = -1.7;
    sceneMembers.floorGroup = floorGroup
  
    sceneMembers.renderer = new WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true, preserveDrawingBuffer: true });
    sceneMembers.renderer.shadowMap.enabled = true;
    sceneMembers.renderer.setPixelRatio(window.devicePixelRatio);
    sceneMembers.renderer.sortObjects = false;
    // 解决多个camera背景透明的问题, 属性的值设为false来阻止对应缓存被清除
    sceneMembers.renderer.autoClearColor = true;
    // 定义渲染器是否在渲染每一帧之前自动清除深度缓存
    sceneMembers.renderer.autoClearDepth = true;
  
    sceneMembers.renderer.autoClearStencil = true;
    // 定义渲染器是否在渲染每一帧之前自动清除其输出
    sceneMembers.renderer.autoClear = true;
    // GLTF模型需要
    // renderer.outputEncoding = sRGBEncoding;
    sceneMembers.renderer.outputColorSpace = SRGBColorSpace
    sceneMembers.renderer.setSize(width, height);
  
    console.log('renderer: {autoClearColor} {autoClearDepth} {autoClearStencil}', 
      sceneMembers.renderer.autoClearColor, 
      sceneMembers.renderer.autoClearDepth, 
      sceneMembers.renderer.autoClearStencil)
  
    document.body.appendChild(sceneMembers.renderer.domElement);
  
    sceneMembers.scene = new Scene();
  
    sceneMembers.scene.background = new Color(0x87CEFA);
  
    sceneMembers.camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
    sceneMembers.camera.position.set(20, 10, 40);
  
    sceneMembers.controls = new OrbitControls(sceneMembers.camera, sceneMembers.renderer.domElement);
    sceneMembers.controls.minDistance = 2;
    sceneMembers.controls.maxDistance = 800;
    sceneMembers.controls.enablePan = true;
    sceneMembers.controls.enableDamping = true;
    sceneMembers.controls.dampingFactor = 0.05;
  
    //
  
    sceneMembers.scene.add(new AmbientLight(0xaaaaaa, 1 * Math.PI));
  
    const light = new DirectionalLight(0xddffdd, 0.6 * Math.PI);
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
  
    sceneMembers.scene.add(light);
  
    // model
  
    const manager = new LoadingManager();
  
    manager.onProgress = function (item, loaded, total) {
  
      console.log(item, loaded, total);
  
    };
  
    const loader = new GLTFLoader(manager);
    loader.load('/gltf/sofa/SM_单人沙发_80cm.gltf', function (object) {
  
      let scale = 1.0;
  
      sceneMembers.sofa = object.scene
  
      sceneMembers.sofa.name = 'sofa'
  
      sceneMembers.sofa.traverse(function (child) {
  
        if (child instanceof Mesh) {
  
          child.geometry.center();
          child.geometry.computeBoundingSphere();
          scale = 0.2 * child.geometry.boundingSphere.radius;
  
          child.receiveShadow = true;
          child.castShadow = true;
  
        }
  
      });
  
      sceneMembers.sofa.position.y = -0.2;
      sceneMembers.sofa.scale.divideScalar(scale);
      obj3d.add(sceneMembers.sofa);
  
    });
  
    loader.load('/gltf/sofa/SM_双人沙发_160cm.gltf', function (object) {
  
      let scale = 1.0;
  
      sceneMembers.sofa2 = object.scene
  
      sceneMembers.sofa2.name = 'sofa2'
  
      sceneMembers.sofa2.traverse(function (child) {
  
        if (child instanceof Mesh) {
  
          child.geometry.center();
          child.geometry.computeBoundingSphere();
          scale = 0.2 * child.geometry.boundingSphere.radius;
  
          child.receiveShadow = true;
          child.castShadow = true;
  
        }
  
      });
      sceneMembers.sofa2.position.y = -1.3
      sceneMembers.sofa2.position.z = -10;
      sceneMembers.sofa2.position.x = -1;
      sceneMembers.sofa2.scale.divideScalar(scale);
      obj3d.add(sceneMembers.sofa2);
    });
  
    loader.load('/gltf/cabinet/cabinet.glb', function(object) {
  
      sceneMembers.cabinet = object.scene
      sceneMembers.cabinet.name = 'cabinet'
  
      // 如果模型包含动画，可以使用 AnimationMixer 来播放
      sceneMembers.mixer = new AnimationMixer(sceneMembers.cabinet);
      sceneMembers.action= sceneMembers.mixer.clipAction(object.animations[0]); // 假设第一个 clip 是我们要播放的动画
      // action.value.play();
  
      sceneMembers.cabinet.traverse(function (child) {
  
        if (child instanceof Mesh) {
  
          // child.geometry.center();
          // child.geometry.computeBoundingSphere();
          // scale = 0.2
  
          child.receiveShadow = true;
          child.castShadow = true;
  
        }
  
      });
  
      sceneMembers.cabinet.position.y = -1.4;
      sceneMembers.cabinet.position.x = 10;
      sceneMembers.cabinet.scale.multiplyScalar(5);
      obj3d.add(sceneMembers.cabinet);
    })
  
    loader.load('/gltf/house/house.glb', function(object) {
      sceneMembers.house = object.scene
      sceneMembers.house.name = 'house'
      sceneMembers.house.position.y = 5;
      sceneMembers.house.position.x = 15;
      sceneMembers.house.position.z = -10;
      sceneMembers.house.scale.divideScalar(20);
      sceneMembers.house.visible = false;
      obj3d.add(sceneMembers.house);
    })
  
    sceneMembers.scene.add(group);
  
    group.add(obj3d);
  
    const torusGeometry = new TorusGeometry(1, 0.3, 16, 100);
    const torusMaterial = new MeshPhongMaterial({ color: 0xffaaff });
    sceneMembers.torus = new Mesh(torusGeometry, torusMaterial);
    sceneMembers.torus.position.z = - 5;
    sceneMembers.torus.position.y = 5
    sceneMembers.torus.name = 'torus'
    group.add(sceneMembers.torus);
    sceneMembers.torus.receiveShadow = true;
    sceneMembers.torus.castShadow = true;
  
    const floorMaterial = new MeshLambertMaterial({ side: DoubleSide, color: new Color(112, 112, 112) });
  
    const floorGeometry = new PlaneGeometry(1000, 1000);
    const floorMesh = new Mesh(floorGeometry, floorMaterial);
    floorMesh.rotation.x -= Math.PI * 0.5;
    floorMesh.position.y -= 1.5;
    floorGroup.add(floorMesh);
    floorMesh.receiveShadow = true;
  
    const floorMaterial2 = new MeshLambertMaterial({ side: DoubleSide, color: new Color(0, 0, 0) });
  
    const floorGeometry2 = new PlaneGeometry(1000, 1000);
    const floorMesh2 = new Mesh(floorGeometry2, floorMaterial2);
    floorMesh2.rotation.x -= Math.PI * 0.5;
    floorMesh2.position.y -= 1.5001;
    floorGroup.add(floorMesh2);
    floorMesh2.receiveShadow = true;
  
    group.add(floorGroup)
  
    sceneMembers.stats = new Stats();
    container.value.appendChild(sceneMembers.stats.dom);
  
    
  
    sceneMembers.renderer.domElement.style.touchAction = 'none';
  }

  return {init, container, sceneMembers}
}