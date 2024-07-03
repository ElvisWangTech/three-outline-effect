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
#define varying out
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
attribute vec3 normal;
attribute vec3 position;
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
vec3 transformPosition(in vec3 maxLevelPosition) {
    if(popLODInfo[0] == 1.0 && popLODInfo[1] == 1.0) {
        return maxLevelPosition;
    }
    vec3 vertexConstant = vec3(popLODInfo[2], popLODInfo[3], popLODInfo[4]);
    float vertexGridSize = popLODInfo[0];
    float powPrecision = popLODInfo[1];
    float offset = 0.0;
    if
    (powPrecision > 1.0) {
        offset = 0.5;
    }
    vec3 gridPosition = (maxLevelPosition - vertexConstant) / vertexGridSize + offset;
    return
    floor(gridPosition / powPrecision) * powPrecision * vertexGridSize +
    vertexConstant;
}
void main() {
    vec3 position = position;
    position = transformPosition(position);
    gl_Position = CameraShaderDataUniform.view_projection * NodeInfoUniform.world_matrix * vec4( position, 1.0 );
    gl_Position.xy += CameraShaderDataUniform.jitter * gl_Position.w;
    vec3 transformedNormal = NodeInfoUniform.world_normal_matrix * normal;
    vNormal = normalize(transformedNormal);
    vOutlineId = encodeId;
    vPNormal = normalize(CameraShaderDataUniform.normal_projection * transformedNormal);
}