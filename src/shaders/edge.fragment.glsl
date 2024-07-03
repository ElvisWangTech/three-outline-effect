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
#define NORMAL_BIAS 0.012
layout(location = 0) out vec4 pc_fragColor;
#define gl_FragColor pc_fragColor

uniform vec4 coefficient;
uniform vec3 color;
uniform vec2 texelSize;
uniform vec4 edgeThickness;
uniform sampler2D indexNormalMap;
uniform sampler2D depthMap;
uniform mat4 cameraInverseProjectionMatrix;
varying vec2 vUv;
varying vec2 sampleCoordE;
varying vec2 sampleCoordN;
varying vec2 sampleCoordW;
varying vec2 sampleCoordS;


// Decoding view space normals from 2D 0..1 vector

vec3 decodeViewNormalStereo(vec2 enc2) {
    float kScale = 1.7777;
    vec3 nn = vec3(enc2, 0.0) * vec3(2.0 * kScale, 2.0 * kScale, 0.0) + vec3(-kScale, -kScale, 1.0);
    float g = 2.0 / dot(nn.xyz, nn.xyz);
    vec3 n = vec3(nn.xy * g, g - 1.0);
    return n;
}
vec4 getIndexNormal(vec2 uv) {
    vec4 enc = texture2D(indexNormalMap, uv);
    float index = floor(dot(enc.xy, vec2(65280.0, 255.0)));
    vec3 normal = decodeViewNormalStereo(enc.zw);
    return vec4(index, normal);
}
vec3 getPosition(vec2 uv) {
    float zDepth = texture2D(depthMap, uv).x;
    vec4 clipPosition = vec4((vec3(uv, zDepth) - 0.5) * 2.0, 1.0);
    vec4 res = cameraInverseProjectionMatrix * clipPosition;
    return res.xyz / res.w;
}
void main() {
    vec4 data = getIndexNormal(vUv);
    vec4 sampleCoord_dataS = getIndexNormal(sampleCoordS);
    vec4 sampleCoord_dataE = getIndexNormal(sampleCoordE);
    vec4 sampleCoord_dataN = getIndexNormal(sampleCoordN);
    vec4 sampleCoord_dataW = getIndexNormal(sampleCoordW);
    const vec4 one = vec4(1.0);
    vec4 indexDiff = abs(vec4(
    data.x - sampleCoord_dataS.x, data.x - sampleCoord_dataE.x, data.x - sampleCoord_dataN.x, data.x - sampleCoord_dataW.x
    ));
    vec4 normalDiff = vec4(
    dot(data.yzw, sampleCoord_dataS.yzw), dot(data.yzw, sampleCoord_dataE.yzw), dot(data.yzw, sampleCoord_dataN.yzw), dot(data.yzw, sampleCoord_dataW.yzw)
    );
    float indexEdge = clamp(dot(indexDiff, one), 0.0, 1.0);
    float normalEdge = clamp(dot(1.0 - normalDiff, one) - float(NORMAL_BIAS), 0.0, 1.0);
    float edge = max(indexEdge * coefficient.x, normalEdge * coefficient.y);
    vec3 position = getPosition(vUv);
    vec3 positionS = getPosition(sampleCoordS);
    vec3 positionE = getPosition(sampleCoordE);
    vec3 positionN = getPosition(sampleCoordN);
    vec3 positionW = getPosition(sampleCoordW);
    vec3 normalS = sampleCoord_dataS.yzw;
    vec3 normalE = sampleCoord_dataE.yzw;
    vec3 normalN = sampleCoord_dataN.yzw;
    vec3 normalW = sampleCoord_dataW.yzw;
    vec3 posDirS = normalize(position - positionS);
    vec3 posDirE = normalize(position - positionE);
    vec3 posDirN = normalize(position - positionN);
    vec3 posDirW = normalize(position - positionW);
    float depthEdge = max(
    abs(abs(dot(posDirS, normalS)) - abs(dot(posDirN, normalN))), abs(abs(dot(posDirE, normalE)) - abs(dot(posDirW, normalW)))
    );
    depthEdge = smoothstep(0.15, 1.0, depthEdge);
    edge = max(depthEdge * coefficient.z, edge);
    gl_FragColor = vec4(color, edge);
}