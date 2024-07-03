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

uniform float popLODInfo[5];
uniform vec2 encodeId;
flat varying vec2 vOutlineId;
varying vec3 vPNormal;
varying vec3 vNormal;
struct NodeInfo {
    mat4 world_matrix;
    mat3 world_normal_matrix;
};
layout (std140) uniform NodeInfoUBO {
    NodeInfo NodeInfoUniform;
};
struct CameraShaderData {
    mat4 projection;
    mat4 view_projection;
    mat4 view;
    mat4 rotation_vp;
    mat3 normal_projection;
    vec3 world_position;
    vec2 jitter;
};
layout (std140) uniform CameraShaderDataUBO {
    CameraShaderData CameraShaderDataUniform;
};

// Encoding view space normals into 2D 0..1 vector

vec2 encodeNormal(vec3 n) {
    float kScale = 1.7777;
    vec2 enc;
    enc = n.xy / (n.z + 1.0);
    enc /= kScale;
    enc = enc * 0.5 + 0.5;
    return enc;
}
void main() {
    vec3 normal = normalize(vNormal);
    #ifdef DOUBLE_SIDE
        normal = normal * (gl_FrontFacing ? 1.0 : -1.0);
    #endif
    gl_FragColor = vec4(vOutlineId, encodeNormal(normalize(vPNormal)));
}