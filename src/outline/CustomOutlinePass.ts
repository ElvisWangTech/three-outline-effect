import * as THREE from "three";
import { Pass } from "three/examples/jsm/postprocessing/Pass.js";
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import {
  getSurfaceIdMaterial,
} from "./FindSurfaces.js";

// Follows the structure of
// 		https://github.com/mrdoob/three.js/blob/master/examples/jsm/postprocessing/OutlinePass.js
class CustomOutlinePass extends Pass {
  renderScene: THREE.Scene;
  renderCamera: THREE.PerspectiveCamera;
  selectedObjects: THREE.Object3D<THREE.Event>[];
  resolution: THREE.Vector2;
  _oldClearColor: THREE.Color;
  oldClearAlpha: number;
  fsQuad: FullScreenQuad;
  outlineMaterial: THREE.ShaderMaterial;
  surfaceBuffer: THREE.WebGLRenderTarget;
  normalOverrideMaterial: THREE.MeshNormalMaterial;
  surfaceIdOverrideMaterial: THREE.ShaderMaterial;
  _visibilityCache: Map<any, any>;
  renderTargetDepthBuffer: THREE.WebGLRenderTarget;
  textureMatrix: THREE.Matrix4;
  renderTargetMaskBuffer: THREE.WebGLRenderTarget;
  depthMaterial: THREE.MeshDepthMaterial;
  prepareMaskMaterial: THREE.ShaderMaterial;
  overlayMaterial: THREE.ShaderMaterial;
  constructor(resolution: THREE.Vector2, scene: THREE.Scene, camera: THREE.PerspectiveCamera, selectedObjects?: THREE.Object3D[]) {
    super();

    this.renderScene = scene;
    this.renderCamera = camera;
    this.selectedObjects = selectedObjects !== undefined ? selectedObjects : [];
    this.resolution = new THREE.Vector2(resolution.x, resolution.y);

    this._oldClearColor = new THREE.Color();
    this.oldClearAlpha = 1;

    this.fsQuad = new FullScreenQuad();
    this.outlineMaterial = this.createOutlinePostProcessMaterial();
    this.fsQuad.material = this.outlineMaterial;

    // Create a buffer to store the normals of the scene onto
    // or store the "surface IDs"
    const surfaceBuffer = new THREE.WebGLRenderTarget(
      this.resolution.x,
      this.resolution.y
    );
    surfaceBuffer.texture.format = THREE.RGBAFormat;
    surfaceBuffer.texture.type = THREE.HalfFloatType;
    surfaceBuffer.texture.minFilter = THREE.NearestFilter;
    surfaceBuffer.texture.magFilter = THREE.NearestFilter;
    surfaceBuffer.texture.generateMipmaps = false;
    surfaceBuffer.stencilBuffer = false;
    this.surfaceBuffer = surfaceBuffer;

    this.normalOverrideMaterial = new THREE.MeshNormalMaterial();
    this.surfaceIdOverrideMaterial = getSurfaceIdMaterial();

    this._visibilityCache = new Map();

    const pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };

    this.renderTargetDepthBuffer = new THREE.WebGLRenderTarget(this.resolution.x, this.resolution.y, pars);

    this.textureMatrix = new THREE.Matrix4();

    this.renderTargetMaskBuffer = new THREE.WebGLRenderTarget(this.resolution.x, this.resolution.y, pars);
    this.renderTargetMaskBuffer.texture.name = 'OutlinePass.mask';
    this.renderTargetMaskBuffer.texture.generateMipmaps = false;

    this.depthMaterial = new THREE.MeshDepthMaterial();
    this.depthMaterial.side = THREE.DoubleSide;
    this.depthMaterial.depthPacking = THREE.RGBADepthPacking;
    this.depthMaterial.blending = THREE.NoBlending;

    this.prepareMaskMaterial = this.getPrepareMaskMaterial();
    this.prepareMaskMaterial.side = THREE.DoubleSide;
    this.prepareMaskMaterial.fragmentShader = replaceDepthToViewZ(this.prepareMaskMaterial.fragmentShader, this.renderCamera);

    this.overlayMaterial = this.getOverlayMaterial();

    function replaceDepthToViewZ(string: String, camera: THREE.Camera) {

      var type = (camera as THREE.PerspectiveCamera).isPerspectiveCamera ? 'perspective' : 'orthographic';

      return string.replace(/DEPTH_TO_VIEW_Z/g, type + 'DepthToViewZ');

    }
  }

  dispose() {
    this.surfaceBuffer.dispose();
    this.fsQuad.dispose();
  }

  updateMaxSurfaceId(maxSurfaceId: number) {
    this.surfaceIdOverrideMaterial.uniforms.maxSurfaceId.value = maxSurfaceId;
  }

  setSize(width: number, height: number) {
    this.surfaceBuffer.setSize(width, height);
    this.resolution.set(width, height);

    if (this.fsQuad.material instanceof THREE.ShaderMaterial) {
      this.fsQuad.material.uniforms.screenSize.value.set(
        this.resolution.x,
        this.resolution.y,
        1 / this.resolution.x,
        1 / this.resolution.y
      );
    }

  }

  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {

    if (this.selectedObjects.length > 0) {
      // Turn off writing to the depth buffer
      // because we need to read from it in the subsequent passes.
      const depthBufferValue = writeBuffer.depthBuffer;
      writeBuffer.depthBuffer = false;

      const oldAutoClearColor = renderer.autoClearColor;
      renderer.autoClearColor = true

      // 1. Re-render the scene to capture all suface IDs in a texture.
      renderer.setRenderTarget(this.surfaceBuffer);

      const oldOverrideMaterial = this.renderScene.overrideMaterial;

      this.renderScene.overrideMaterial = this.surfaceIdOverrideMaterial;

      // 只渲染selectedObjects中的对象
      // this.selectedObjects.forEach(obj => {
      //   obj.visible = true; // 确保选中的对象是可见的
      // });
      // this.renderScene.traverse(object => {
      //   if (!this.selectedObjects.includes(object)) {
      //     object.layers.disableAll(); // 禁用未选中对象的所有层
      //   }
      // });

      renderer.render(this.renderScene, this.renderCamera);

      // 恢复所有对象的可见性
      // this.renderScene.traverse(object => {
      //   object.layers.enableAll(); // 启用所有层
      // });
      this.renderScene.overrideMaterial = oldOverrideMaterial;

      (this.fsQuad.material as THREE.ShaderMaterial).uniforms["depthBuffer"].value =
        readBuffer.depthTexture;
      (this.fsQuad.material as THREE.ShaderMaterial).uniforms["surfaceBuffer"].value =
        this.surfaceBuffer.texture;
      (this.fsQuad.material as THREE.ShaderMaterial).uniforms["sceneColorBuffer"].value =
        readBuffer.texture;

      // 2. Draw the outlines using the depth texture and normal texture
      // and combine it with the scene color
      if (this.renderToScreen) {
        // If this is the last effect, then renderToScreen is true.
        // So we should render to the screen by setting target null
        // Otherwise, just render into the writeBuffer that the next effect will use as its read buffer.
        renderer.setRenderTarget(null);
        this.fsQuad.render(renderer);
      } else {
        renderer.setRenderTarget(writeBuffer);
        this.fsQuad.render(renderer);
      }

      // Reset the depthBuffer value so we continue writing to it in the next render.
      writeBuffer.depthBuffer = depthBufferValue;
      renderer.autoClearColor = oldAutoClearColor;
    }
  }

  get vertexShader() {
    return `
			varying vec2 vUv;
			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
			`;
  }
  get fragmentShader() {
    return `
			#include <packing>
			// The above include imports "perspectiveDepthToViewZ"
			// and other GLSL functions from ThreeJS we need for reading depth.
			uniform sampler2D sceneColorBuffer;
			uniform sampler2D depthBuffer;
			uniform sampler2D surfaceBuffer;
			uniform float cameraNear;
			uniform float cameraFar;
			uniform vec4 screenSize;
			uniform vec3 outlineColor;
			uniform vec2 multiplierParameters;

			varying vec2 vUv;

			// Helper functions for reading from depth buffer.
			float readDepth (sampler2D depthSampler, vec2 coord) {
				float fragCoordZ = texture2D(depthSampler, coord).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
				return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
			}
			float getLinearDepth(vec3 pos) {
				return -(viewMatrix * vec4(pos, 1.0)).z;
			}

			float getLinearScreenDepth(sampler2D map) {
					vec2 uv = gl_FragCoord.xy * screenSize.zw;
					return readDepth(map,uv);
			}
			// Helper functions for reading normals and depth of neighboring pixels.
			float getPixelDepth(int x, int y) {
				// screenSize.zw is pixel size 
				// vUv is current position
				return readDepth(depthBuffer, vUv + screenSize.zw * vec2(x, y));
			}
			// "surface value" is either the normal or the "surfaceID"
			vec3 getSurfaceValue(int x, int y) {
				vec3 val = texture2D(surfaceBuffer, vUv + screenSize.zw * vec2(x, y)).rgb;
				return val;
			}

			float saturateValue(float num) {
				return clamp(num, 0.0, 1.0);
			}

			float getSufaceIdDiff(vec3 surfaceValue) {
				float surfaceIdDiff = 0.0;
				surfaceIdDiff += distance(surfaceValue, getSurfaceValue(1, 0));
				surfaceIdDiff += distance(surfaceValue, getSurfaceValue(0, 1));
				surfaceIdDiff += distance(surfaceValue, getSurfaceValue(0, 1));
				surfaceIdDiff += distance(surfaceValue, getSurfaceValue(0, -1));

				surfaceIdDiff += distance(surfaceValue, getSurfaceValue(1, 1));
				surfaceIdDiff += distance(surfaceValue, getSurfaceValue(1, -1));
				surfaceIdDiff += distance(surfaceValue, getSurfaceValue(-1, 1));
				surfaceIdDiff += distance(surfaceValue, getSurfaceValue(-1, -1));
				return surfaceIdDiff;
			}

			void main() {
				vec4 sceneColor = texture2D(sceneColorBuffer, vUv);
				float depth = getPixelDepth(0, 0);
				vec3 surfaceValue = getSurfaceValue(0, 0);

				// Get the difference between depth of neighboring pixels and current.
				float depthDiff = 0.0;
				depthDiff += abs(depth - getPixelDepth(1, 0));
				depthDiff += abs(depth - getPixelDepth(-1, 0));
				depthDiff += abs(depth - getPixelDepth(0, 1));
				depthDiff += abs(depth - getPixelDepth(0, -1));

				// Get the difference between surface values of neighboring pixels
				// and current
				float surfaceValueDiff = getSufaceIdDiff(surfaceValue);
				
				// Apply multiplier & bias to each 
				float depthBias = multiplierParameters.x;
				float depthMultiplier = multiplierParameters.y;

				depthDiff = depthDiff * depthMultiplier;
				depthDiff = saturateValue(depthDiff);
				depthDiff = pow(depthDiff, depthBias);

				if (surfaceValueDiff != 0.0) surfaceValueDiff = 1.0;

				float outline = saturateValue(surfaceValueDiff + depthDiff);
			
				// Combine outline with scene color.
				vec4 outlineColor = vec4(outlineColor, 1.0);
				gl_FragColor = vec4(mix(sceneColor, outlineColor, outline));
			}
			`;
  }

  createOutlinePostProcessMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        sceneColorBuffer: { value: undefined },
        depthBuffer: { value: undefined },
        surfaceBuffer: { value: undefined },
        outlineColor: { value: new THREE.Color(0xffffff) },
        //4 scalar values packed in one uniform:
        //  depth multiplier, depth bias
        multiplierParameters: {
          value: new THREE.Vector2(0.9, 20),
        },
        cameraNear: { value: this.renderCamera.near },
        cameraFar: { value: this.renderCamera.far },
        screenSize: {
          value: new THREE.Vector4(
            this.resolution.x,
            this.resolution.y,
            1 / this.resolution.x,
            1 / this.resolution.y
          ),
        },
      },
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });
  }

  changeVisibilityOfNonSelectedObjects(bVisible: boolean) {

    const cache = this._visibilityCache;
    const selectedMeshes: THREE.Object3D[] = [];

    function gatherSelectedMeshesCallBack(object: THREE.Object3D) {

      if ((object as THREE.Mesh).isMesh) selectedMeshes.push(object);

    }

    for (let i = 0; i < this.selectedObjects.length; i++) {

      const selectedObject = this.selectedObjects[i];
      selectedObject.traverse(gatherSelectedMeshesCallBack);

    }

    function VisibilityChangeCallBack(object: THREE.Object3D) {

      if ((object as THREE.Mesh).isMesh || (object as THREE.Sprite).isSprite) {

        // only meshes and sprites are supported by OutlinePass

        let bFound = false;

        for (let i = 0; i < selectedMeshes.length; i++) {

          const selectedObjectId = selectedMeshes[i].id;

          if (selectedObjectId === object.id) {

            bFound = true;
            break;

          }

        }

        if (bFound === false) {

          const visibility = object.visible;

          if (bVisible === false || cache.get(object) === true) {

            object.visible = bVisible;

          }

          cache.set(object, visibility);

        }

      } else if ((object as THREE.Points).isPoints || (object as THREE.Line).isLine) {

        // the visibilty of points and lines is always set to false in order to
        // not affect the outline computation

        if (bVisible === true) {

          object.visible = cache.get(object); // restore

        } else {

          cache.set(object, object.visible);
          object.visible = bVisible;

        }

      }

    }

    this.renderScene.traverse(VisibilityChangeCallBack);

  }

  changeVisibilityOfSelectedObjects(bVisible: boolean) {

    const cache = this._visibilityCache;

    function gatherSelectedMeshesCallBack(object: THREE.Object3D) {

      if ((object as THREE.Mesh).isMesh) {

        if (bVisible === true) {

          object.visible = cache.get(object);

        } else {

          cache.set(object, object.visible);
          object.visible = bVisible;

        }

      }

    }

    for (let i = 0; i < this.selectedObjects.length; i++) {

      const selectedObject = this.selectedObjects[i];
      selectedObject.traverse(gatherSelectedMeshesCallBack);

    }

  }

  getPrepareMaskMaterial() {

    return new THREE.ShaderMaterial({

      uniforms: {
        'depthTexture': { value: null },
        'cameraNearFar': { value: new THREE.Vector2(0.5, 0.5) },
        'textureMatrix': { value: null }
      },

      vertexShader:
        `#include <morphtarget_pars_vertex>
				#include <skinning_pars_vertex>

				varying vec4 projTexCoord;
				varying vec4 vPosition;
				uniform mat4 textureMatrix;

				void main() {

					#include <skinbase_vertex>
					#include <begin_vertex>
					#include <morphtarget_vertex>
					#include <skinning_vertex>
					#include <project_vertex>

					vPosition = mvPosition;
					vec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );
					projTexCoord = textureMatrix * worldPosition;

				}`,

      fragmentShader:
        `#include <packing>
				varying vec4 vPosition;
				varying vec4 projTexCoord;
				uniform sampler2D depthTexture;
				uniform vec2 cameraNearFar;

				void main() {

					float depth = unpackRGBAToDepth(texture2DProj( depthTexture, projTexCoord ));
					float viewZ = - DEPTH_TO_VIEW_Z( depth, cameraNearFar.x, cameraNearFar.y );
					float depthTest = (-vPosition.z > viewZ) ? 1.0 : 0.0;
					gl_FragColor = vec4(0.0, depthTest, 1.0, 1.0);

				}`

    });

  }

  getOverlayMaterial() {

    return new THREE.ShaderMaterial({

      uniforms: {
        'maskTexture': { value: null },
        'edgeTexture': { value: null },
      },

      vertexShader:
        `varying vec2 vUv;

				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,

      fragmentShader:
        `varying vec2 vUv;

				uniform sampler2D maskTexture;
				uniform sampler2D edgeTexture;

				void main() {
					vec4 edgeValue = texture2D(edgeTexture, vUv);
					vec4 maskColor = texture2D(maskTexture, vUv);
					float visibilityFactor = 1.0 - maskColor.g > 0.0 ? 1.0 : 0.5;
					vec4 finalColor = maskColor.r * edgeValue;
					gl_FragColor = finalColor;
				}`,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true
    });

  }

  updateTextureMatrix() {

    this.textureMatrix.set(0.5, 0.0, 0.0, 0.5,
      0.0, 0.5, 0.0, 0.5,
      0.0, 0.0, 0.5, 0.5,
      0.0, 0.0, 0.0, 1.0);
    this.textureMatrix.multiply(this.renderCamera.projectionMatrix);
    this.textureMatrix.multiply(this.renderCamera.matrixWorldInverse);

  }
}

export { CustomOutlinePass };
