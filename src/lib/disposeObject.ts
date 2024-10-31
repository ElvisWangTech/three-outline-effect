import { Object3D, Material } from "three";

export function removeAndDisposeObject3D(object: Object3D|undefined): void {
  if (!object) {
    return;
  }

  // 对自己进行移出，解除引用关系
  object.removeFromParent();

  object.children.slice().forEach(child => {
    // 先释放child
    removeAndDisposeObject3D(child);
  });

  // 释放material和texture
  const obj = object as any;
  if (obj.geometry) {
    const geo = obj.geometry as any;
    if (geo.dispose) geo.dispose();
    if (obj.material) disposeMaterial(obj.material);
  }
}

/**
 * 销毁材质，包括material和texture
 * @param material
 * @returns
 */
export function disposeMaterial(material: Material|Material[]|undefined) {
  if (!material) {
    return;
  }

  const mat = material as any;

  if (mat instanceof Array) {
    mat.forEach(matItem => {
      if (Array.isArray(matItem) && matItem.map) {
        (matItem.map as any).dispose();
      }
      if (matItem.dispose) matItem.dispose();
    });
  } else {
    if (mat.map) {
      mat.map.dispose();
    }
  }

  if (mat.dispose) mat.dispose();
}