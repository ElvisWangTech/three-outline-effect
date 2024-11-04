import { BufferAttribute, BufferGeometry, Vector3 } from "three";

export const offsetVertices = (geometry: BufferGeometry, offset = 0.002) => {
  // scale mesh vertices begin

  const nonIndexedGeometry = geometry.toNonIndexed()

  nonIndexedGeometry.computeVertexNormals()

  const normals = nonIndexedGeometry.getAttribute('normal')
  const positions = nonIndexedGeometry.getAttribute('position')
  const newPositions = new Float32Array(positions.count * 3);

  
  // 分组重复的点，对于重合的点计算平均法线
  const vertices: Vector3[] = [];
  const averageNormals: Vector3[] = [];
  for (let i = 0; i < positions.count; i++) {
    // 获取顶点位置
    const v = new Vector3(positions.getX(i), positions.getY(i), positions.getZ(i))
    const nv = new Vector3(normals.getX(i), normals.getY(i), normals.getZ(i))
    const index = vertices.findIndex(_v => _v.distanceTo(v) < 1e-4)
    if (index < 0) {
      vertices.push(v)
      averageNormals.push(nv)
    } else {
      averageNormals[index] = averageNormals[index].add(nv)
    }
  }

  for (let i = 0; i < positions.count; i++) {
    // 获取顶点位置
    const v = new Vector3(positions.getX(i), positions.getY(i), positions.getZ(i))
    const index = vertices.findIndex(_v => _v.equals(v))
    const nv = new Vector3(normals.getX(i), normals.getY(i), normals.getZ(i));
    if (index >= 0) {
      nv.copy(averageNormals[index].normalize())
    }

    // 计算偏移量，这里假设1单位长度在屏幕上显示为1像素
    // 根据你的相机和投影矩阵，这个值可能需要调整
    const scale = offset; // 这里需要根据实际情况调整比例因子

    // 计算偏移后的顶点位置
    const offsetV = nv.multiplyScalar(scale).add(v)

    // 存储偏移后的顶点位置
    newPositions[i * 3] = offsetV.x
    newPositions[(i * 3) + 1] = offsetV.y
    newPositions[(i * 3) + 2] = offsetV.z;
  }
  
  // 更新EdgesGeometry的顶点位置
  const edgesPositionAttribute = nonIndexedGeometry.getAttribute('position') as BufferAttribute ;
  if (edgesPositionAttribute.isBufferAttribute) {
    edgesPositionAttribute.set(newPositions)
  }

  // scale mesh vertices end

  return nonIndexedGeometry
}