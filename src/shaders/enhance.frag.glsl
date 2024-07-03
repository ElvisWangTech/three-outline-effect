#version 300 es

#define gl_FragDepthEXT gl_FragDepth
#define texture2D texture
#define textureCube texture
#define texture2DProj textureProj
#define texture2DLodEXT textureLod
#define texture2DProjLodEXT textureProjLod
#define textureCubeLodEXT textureLod
#define texture2DGradEXT textureGrad
#define texture2DProjGradEXT textureProjGrad
#define textureCubeGradEXT textureGrad
#define attribute in
#define varying in

#define PI 3.1415926535
#define PI2 6.28318530718
#define PI_HALF 1.5707963267949
#define RECIPROCAL_PI 0.31830988618
#define RECIPROCAL_PI2 0.15915494
#define LOG2 1.442695
#define EPSILON 1e-6
#define saturate(a) clamp(a, 0.0, 1.0)
// NOTE: pbr
#define INVERSE_PI 0.31830988618
#define TWO_PI 2.0 * PI
#define DEPTH_CLIP_RATIO 0.99
#define EPSILON_SHADING 1e-5
#define EULERS_NUMBER 2.71828

precision highp float;
precision highp int;
precision mediump sampler3D;
layout(location = 0) out vec4 pc_fragColor;
#define gl_FragColor pc_fragColor

uniform sampler2D tDiffuse;
uniform vec2 texelSize;
varying vec2 vUv;
void main() {
    vec4 color = vec4(0.0);
    color += texture2D(tDiffuse, vUv + texelSize * vec2(0.0, 0.0)).rgba;
    color += texture2D(tDiffuse, vUv + texelSize * vec2(1.0, 0.0)).rgba;
    color += texture2D(tDiffuse, vUv + texelSize * vec2(0.0, 1.0)).rgba;
    color += texture2D(tDiffuse, vUv + texelSize * vec2(1.0, 1.0)).rgba;
    color *= 0.25;
    #ifdef CORRECT_COLOR
        if(color.a > 0.0) {
            color.rgb /= color.a;
        }
    #endif
    
    gl_FragColor = color;
}