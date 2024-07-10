import * as THREE from "three";
import { Pass, FullScreenQuad } from "three/examples/jsm/postprocessing/Pass.js";
import {
  getSurfaceIdMaterial,
} from "./FindSurfaces";

// Follows the structure of
// 		https://github.com/mrdoob/three.js/blob/master/examples/jsm/postprocessing/OutlinePass.js
class CustomOutlinePass extends Pass {
  renderScene: THREE.Scene;
  renderCamera: THREE.PerspectiveCamera;
  resolution: THREE.Vector2;
  fsQuad: any;
  surfaceBuffer: THREE.WebGLRenderTarget;
  depthTarget: THREE.WebGLRenderTarget;
  nonSelectDepthTarget: THREE.WebGLRenderTarget;
  surfaceIdOverrideMaterial: THREE.ShaderMaterial;
	constructor(resolution: THREE.Vector2, scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
		super();

		this.renderScene = scene;
		this.renderCamera = camera;
		this.resolution = new THREE.Vector2(resolution.x, resolution.y);

		this.fsQuad = new FullScreenQuad();
		this.fsQuad.material = this.createOutlinePostProcessMaterial();

    // Create a buffer to store the normals of the scene onto
    // or store the "surface IDs"
    this.surfaceBuffer = this.createRenderTarget(resolution.x, resolution.y);

		// Create a buffer to store the depth of the scene 
		// we don't use the default depth buffer because
		// this one includes only objects that have the outline applied
		this.nonSelectDepthTarget = this.createRenderTarget(resolution.x, resolution.y)

		this.depthTarget = this.createRenderTarget(resolution.x, resolution.y)

    this.surfaceIdOverrideMaterial = getSurfaceIdMaterial();
	}

  private createRenderTarget(x: number, y: number) {
    const buffer = new THREE.WebGLRenderTarget(x, y);
    buffer.texture.format = THREE.RGBAFormat;
    buffer.texture.type = THREE.HalfFloatType;
    buffer.texture.minFilter = THREE.NearestFilter;
    buffer.texture.magFilter = THREE.NearestFilter;
    buffer.texture.generateMipmaps = false;
    buffer.stencilBuffer = false;
    buffer.depthBuffer = true;
    buffer.depthTexture = new THREE.DepthTexture(x, y);
    return buffer;
  }

	dispose() {
    this.surfaceBuffer.dispose();
    this.depthTarget.dispose();
    this.nonSelectDepthTarget.dispose();
		this.fsQuad.dispose();
	}

  updateMaxSurfaceId(maxSurfaceId: number) {
    this.surfaceIdOverrideMaterial.uniforms.maxSurfaceId.value = maxSurfaceId;
  }

	setSize(width: number, height: number) {
		this.surfaceBuffer.setSize(width, height);
    this.depthTarget.setSize(width, height);
    this.nonSelectDepthTarget.setSize(width, height);
		this.resolution.set(width, height);

		this.fsQuad.material.uniforms.screenSize.value.set(
			this.resolution.x,
			this.resolution.y,
			1 / this.resolution.x,
			1 / this.resolution.y
		);
	}

	// Helper functions for hiding/showing objects based on whether they should have outlines applied 
	setOutlineObjectsVisibile(bVisible: boolean) {
		this.renderScene.traverse( function( node ) {
		    if (node.userData.applyOutline == true && node.type == 'Mesh') {

		    	if (!bVisible) {
		    		node.userData.oldVisibleValue = node.visible;
		    		node.visible = false;
		    	} else {
		    		// Restore original visible value. This way objects
		    		// that were originally hidden stay hidden
		    		if (node.userData.oldVisibleValue != undefined) {
		    			node.visible = node.userData.oldVisibleValue;
		    			delete node.userData.oldVisibleValue;
		    		}
		    	}
		    	
		    	
		    }
		});
	}

	setNonOutlineObjectsVisible(bVisible: boolean) {
		this.renderScene.traverse( function( node ) {
		    if (node.userData.applyOutline != true && node.type == 'Mesh') {

		    	if (!bVisible) {
		    		node.userData.oldVisibleValue = node.visible;
		    		node.visible = false;
		    	} else {
		    		// Restore original visible value. This way objects
		    		// that were originally hidden stay hidden
		    		if (node.userData.oldVisibleValue != undefined) {
		    			node.visible = node.userData.oldVisibleValue;
		    			delete node.userData.oldVisibleValue;
		    		}
		    	}
		    	
		    	
		    }
		});
	}

	/*

	This is a modified pipeline from the original outlines effect
	to support outlining individual objects.

	1 - Render all objects to get final color buffer, with regular depth buffer
		(this is done in index.js)

	2 - Render only non-outlines objects to get `nonOutlinesDepthBuffer`.
		(we need this to depth test our outlines so they render behind objects)

	3 - Render all outlines objects to get normal buffer & depth buffer, which are inputs for the outline effect. 
		This must NOT include objects that won't have outlines applied.

	4 - Render outline effect, using normal and depth buffer that contains only outline objects,
		 use the `nonOutlinesDepthBuffer` for depth test. And finally combine with the final color buffer.
	*/

	render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
		// Turn off writing to the depth buffer
		// because we need to read from it in the subsequent passes.
		const depthBufferValue = writeBuffer.depthBuffer;
		writeBuffer.depthBuffer = false;

    const oldAutoClearColor = renderer.autoClearColor;
    renderer.autoClearColor = true
    const oldBackground = this.renderScene.background;
    this.renderScene.background = new THREE.Color(0xffffff)

		// 1. Re-render the scene to capture all normals in texture.
		// Ideally we could capture this in the first render pass along with
		// the depth texture.
		renderer.setRenderTarget(this.surfaceBuffer);

		const overrideMaterialValue = this.renderScene.overrideMaterial;
		this.renderScene.overrideMaterial = this.surfaceIdOverrideMaterial;
		// Only include objects that have the "applyOutline" property. 
		// We do this by hiding all other objects temporarily.
		this.setNonOutlineObjectsVisible(false);
		renderer.render(this.renderScene, this.renderCamera);
    this.setNonOutlineObjectsVisible(true);
		this.renderScene.overrideMaterial = overrideMaterialValue;

    // 2. render selectd depthBuffer
    renderer.setRenderTarget(this.depthTarget);
    this.setNonOutlineObjectsVisible(false);
    renderer.render(this.renderScene, this.renderCamera);
    this.setNonOutlineObjectsVisible(true);

		// 3. Re-render the scene to capture depth of objects that do NOT have outlines
		renderer.setRenderTarget(this.nonSelectDepthTarget);

		this.setOutlineObjectsVisibile(false);
		renderer.render(this.renderScene, this.renderCamera);
		this.setOutlineObjectsVisibile(true);

		this.fsQuad.material.uniforms["depthBuffer"].value = this.depthTarget.depthTexture;

		this.fsQuad.material.uniforms[
			"surfaceBuffer"
		].value = this.surfaceBuffer.texture;
		this.fsQuad.material.uniforms["sceneColorBuffer"].value =
			readBuffer.texture;
		this.fsQuad.material.uniforms["nonOutlinesDepthBuffer"].value = this.nonSelectDepthTarget.depthTexture;

		// 4. Draw the outlines using the depth texture and normal texture
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
    this.renderScene.background = oldBackground;
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
			uniform sampler2D nonOutlinesDepthBuffer;
			uniform float cameraNear;
			uniform float cameraFar;
			uniform vec4 screenSize;
			uniform vec3 outlineColor;
			uniform vec4 multiplierParameters;
      uniform int debugVisualize;

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


			float getSufaceIdDiff(vec3 surfaceValue) {
				float surfaceIdDiff = 0.0;
				surfaceIdDiff += distance(surfaceValue, getSurfaceValue(1, 0));
				surfaceIdDiff += distance(surfaceValue, getSurfaceValue(0, 1));
				surfaceIdDiff += distance(surfaceValue, getSurfaceValue(-1, 0));
				surfaceIdDiff += distance(surfaceValue, getSurfaceValue(0, -1));

				return surfaceIdDiff;
			}

			float saturate(float num) {
				return clamp(num, 0.0, 1.0);
			}

			void main() {
				vec4 sceneColor = LinearTosRGB(texture2D(sceneColorBuffer, vUv));
				float depth = getPixelDepth(0, 0);
        vec3 surfaceValue = getSurfaceValue(0, 0);
				float nonOutlinesDepth = readDepth(nonOutlinesDepthBuffer, vUv + screenSize.zw);

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
				depthDiff = saturate(depthDiff);
				depthDiff = pow(depthDiff, depthBias);

				if (surfaceValueDiff != 0.0) surfaceValueDiff = 0.4;

				float outline = saturate(surfaceValueDiff + depthDiff);

				// Don't render outlines if they are behind something
				// in the original depth buffer 
				// we find this out by comparing the depth value of current pixel 
				if ( depth > nonOutlinesDepth && debugVisualize != 4 ) {
					outline = 0.0;
				}
			
				// Combine outline with scene color.
				vec4 outlineColor = vec4(outlineColor, 1.0);
				gl_FragColor = vec4(mix(sceneColor, outlineColor, outline));

        // For debug visualization of the different inputs to this shader.
				if (debugVisualize == 1) {
					gl_FragColor = sceneColor;
				}
				if (debugVisualize == 2) {
					gl_FragColor = vec4(vec3(depth), 1.0);
				}
				if (debugVisualize == 5) {
					gl_FragColor = vec4(vec3(nonOutlinesDepth), 1.0);
				}
				if (debugVisualize == 3) {
					gl_FragColor = vec4(surfaceValue, 1.0);
				}
				if (debugVisualize == 4) {
					gl_FragColor = vec4(vec3(outline * outlineColor), 1.0);
				}
			}
			`;
	}

	createOutlinePostProcessMaterial() {
		return new THREE.ShaderMaterial({
			uniforms: {
        debugVisualize: { value: 0 },
				sceneColorBuffer: { value: undefined },
				depthBuffer: { value: undefined },
				surfaceBuffer: { value: undefined },
				nonOutlinesDepthBuffer: { value: undefined },
				outlineColor: { value: new THREE.Color(0x000000) },
				//4 scalar values packed in one uniform: depth multiplier, depth bias, and same for normals.
				multiplierParameters: { value: new THREE.Vector4(1, 1, 1, 1) },
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
}

export { CustomOutlinePass };
