import { Object3D, BufferGeometry, Group, Mesh } from "three";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";

export function mergeObject( object: Object3D ) {

  object.updateMatrixWorld( true );

  const geometry: BufferGeometry[] = [];
  object.traverse( (c: any) => {

    if ( c.isMesh ) {

      const g = c.geometry.clone();
      g.applyMatrix4( c.matrixWorld );
      for ( const key in g.attributes ) {

        if ( key !== 'position' && key !== 'normal' ) {

          g.deleteAttribute( key );

        }

      }
      geometry.push( g.toNonIndexed() );

    }

  } );

  const mergedGeometries = BufferGeometryUtils.mergeGeometries( geometry, false );
  const mergedGeometry = BufferGeometryUtils.mergeVertices( mergedGeometries ).center();

  const group = new Group();
  const mesh = new Mesh( mergedGeometry );
  group.add( mesh );
  return group;

}