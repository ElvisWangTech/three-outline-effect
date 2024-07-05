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

  constructor(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, bgScene: THREE.Scene) {
    this.renderer = renderer
    this.camera = camera;
    this.bgScene = bgScene;
  }

  init() {
    const depthTexture = new THREE.DepthTexture(window.innerWidth, window.innerHeight);
    const renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
      {
        depthTexture: depthTexture,
        depthBuffer: true,
      }
    );

    // Initial render pass.
    this.composer = new EffectComposer(this.renderer, renderTarget);

    const pass = new RenderPass(this.bgScene, this.camera);
    pass.clear = true
    pass.clearDepth = true
    this.composer.addPass(pass);

    // // Outline pass.
    this.customOutline = new CustomOutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.bgScene,
      this.camera
    );
    this.composer.addPass(this.customOutline);

    // Antialias pass.
    this.effectFXAA = new ShaderPass(FXAAShader);
    this.effectFXAA.uniforms["resolution"].value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
    this.composer.addPass(this.effectFXAA);

    //转为sRGB
    this.composer.addPass(new ShaderPass(GammaCorrectionShader)); //sRGB

    this.surfaceFinder = new FindSurfaces();

    window.addEventListener("resize", this.onWindowResize, false);
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
      this.customOutline!.updateMaxSurfaceId(this.surfaceFinder!.surfaceId + 1);
    })
    this.customOutline.selectedObjects = objs;
  }

  restoreObjs() {
    this.bgScene.traverse(obj => {
      obj.traverse((node) => {
        if (node.type == "Mesh") {
          (node as THREE.Mesh).geometry.deleteAttribute('color')

        }
      });
    })

    if (this.customOutline) {
      this.customOutline.selectedObjects = [];
    }

  }

  // setOutlineRenderObjs(objs: THREE.Object3D[]) {
  //   this.customOutline && (this.customOutline.selectedObjects = objs);
  // }

  // detachRenderObjs() {
  //   this.customOutline && (this.customOutline.selectedObjects = []);
  // }

  protected onWindowResize() {

    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
    }
    this.camera && this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer && this.composer.setSize(window.innerWidth, window.innerHeight);
    this.effectFXAA && this.effectFXAA.setSize(window.innerWidth, window.innerHeight);
    this.customOutline && this.customOutline.setSize(window.innerWidth, window.innerHeight);
    this.effectFXAA && this.effectFXAA.uniforms["resolution"].value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
  }

  protected dispose() {
    window.removeEventListener("resize", this.onWindowResize, false);
  }

  protected render() {
    this.composer?.render();
  }
}