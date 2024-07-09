import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { CustomOutlinePass } from './CustomOutlinePass';
import FindSurfaces from './FindSurfaces';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader';

export class OutlineComposor {
  renderer: THREE.WebGLRenderer;
  surfaceFinder?: FindSurfaces;
  effectFXAA?: ShaderPass;
  camera: THREE.PerspectiveCamera;
  composer?: EffectComposer;
  customOutline?: CustomOutlinePass;
  bgScene: THREE.Scene;
  // private scene: THREE.Scene = new THREE.Scene();
  onWindowSizeBinded = this.onWindowResize.bind(this);
  selectedObjs: THREE.Object3D<THREE.Event>[];

  constructor(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, bgScene: THREE.Scene) {
    this.renderer = renderer
    this.camera = camera;
    this.bgScene = bgScene;
    this.selectedObjs = [];
  }

  init() {

    // Initial render pass.
    this.composer = new EffectComposer(this.renderer);
    const pixelRatio = this.renderer.getPixelRatio();
    const size = this.renderer.getSize(new THREE.Vector2()).multiplyScalar(pixelRatio);

    const pass = new RenderPass(this.bgScene, this.camera);
    pass.clear = true
    pass.clearDepth = true
    this.composer.addPass(pass);

    // // Outline pass.
    this.customOutline = new CustomOutlinePass(
      new THREE.Vector2(size.x, size.y),
      this.bgScene,
      this.camera
    );
    this.composer.addPass(this.customOutline);

    // Antialias pass.
    this.effectFXAA = new ShaderPass(FXAAShader);
    this.effectFXAA.uniforms["resolution"].value.set(
      1 / size.x,
      1 / size.y
    );
    this.composer.addPass(this.effectFXAA);

    //转为sRGB
    // this.composer.addPass(new ShaderPass(GammaCorrectionShader)); //sRGB

    this.surfaceFinder = new FindSurfaces();

    window.addEventListener("resize", this.onWindowSizeBinded, false);
  }

  addSurfaceIdAttributeToMesh(objs: THREE.Object3D[]) {
    if (!this.surfaceFinder || !this.customOutline) return;
    this.surfaceFinder.surfaceId = 0;
    // 添加到场景
    // this.scene.clear()
    objs.forEach(obj => {
      obj.traverse((node) => {
        if (node.type == "Mesh") {
          const colorsTypedArray = this.surfaceFinder!.getSurfaceIdAttribute(node as THREE.Mesh);
          (node as THREE.Mesh).geometry.setAttribute(
            "color",
            new THREE.BufferAttribute(colorsTypedArray, 4)
          );

        }
      });
    })
    this.customOutline!.updateMaxSurfaceId(this.surfaceFinder!.surfaceId + 1);
  }

  removeSurfaceIdAttribute(objs: THREE.Object3D[]) {
    objs.forEach(obj => {
      obj.traverse((node) => {
        if (node.type == "Mesh") {
          (node as THREE.Mesh).geometry.deleteAttribute('color')

        }
      });
    })
  }

  applyOutline(objs: THREE.Object3D[]) {
    this.selectedObjs = objs;
    objs.forEach(obj => {
      obj.traverse((node) => {
        if (node.type == "Mesh") {
          (node as THREE.Mesh).userData.applyOutline = true;
        }
      });
    })
  }

  restoreObjs() {
    this.selectedObjs.forEach(obj => {
      obj.traverse((node) => {
        if (node.type == "Mesh") {
          (node as THREE.Mesh).userData.applyOutline = false;
        }
      });
    })
    this.selectedObjs = [];
  }

  protected onWindowResize() {

    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
    }
    this.camera && this.camera.updateProjectionMatrix();

    this.renderer && this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer && this.composer.setSize(window.innerWidth, window.innerHeight);
    this.effectFXAA && this.effectFXAA.setSize(window.innerWidth, window.innerHeight);
    this.customOutline && this.customOutline.setSize(window.innerWidth, window.innerHeight);
    this.effectFXAA && this.effectFXAA.uniforms["resolution"].value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
  }

  protected dispose() {
    window.removeEventListener("resize", this.onWindowSizeBinded, false);
  }

  render() {
    this.composer?.render();
  }

  setSize(width: number, height: number) {
    this.composer?.setSize(width, height)
  } 
}