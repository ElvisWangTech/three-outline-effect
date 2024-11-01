import { Object3D, EdgesGeometry, LineBasicMaterial, LineSegments, Mesh, ShaderMaterial } from "three";
import { BufferGeometryUtils, LineSegments2, LineSegmentsGeometry, LineMaterial, VertexNormalsHelper } from "three/examples/jsm/Addons.js";
import { ConditionalEdgesGeometry } from "../../conditional-line/ConditionalEdgesGeometry";
import { ConditionalEdgesShader } from "../../conditional-line/ConditionalEdgesShader";
import { ConditionalLineMaterial } from "../../conditional-line/Lines2/ConditionalLineMaterial";
import { ConditionalLineSegmentsGeometry } from "../../conditional-line/Lines2/ConditionalLineSegmentsGeometry";
import { OutsideEdgesGeometry } from "../../conditional-line/OutsideEdgesGeometry";
import { ConditionalPanelParam, ISceneMembers } from "../../types";
import { removeAndDisposeObject3D } from "../../lib/disposeObject";
import { offsetVertices } from "../../lib/geometryUtil";

export const useConditionalModel = (sceneMembers: ISceneMembers, params: ConditionalPanelParam) => {

  params.reDrawFn = () => {
    reInitEdgesModels()
    reInitConditionalModels()
  }

  const onParamChange = (paramKey: keyof ConditionalPanelParam, value?: any) => {
    switch (paramKey) {
      case 'threshold': 
      case 'display': 
        reInitEdgesModels();break;
      case 'displayOriginalModels':
        displayOriginalModels(value);break;
      case 'displayVertexNormals':
        displayVertexNormals(value); break;
      default:
        updateEdgeModels()
        updateConditionalModels()
    }
  }


  function removeConditionalModel (conditionalModel: Object3D) {
    conditionalModel.parent?.remove( conditionalModel );
      const index = sceneMembers.conditionalModels.indexOf(conditionalModel)
      if (index >= 0) {
        sceneMembers.conditionalModels.splice(index, 1)
      }
      conditionalModel.traverse( (c: any) => {

        if ( c.isMesh ) {

          c.material.dispose();

        }

      } );
  }

  function removeConditionalModels() {
    sceneMembers.conditionalModels.slice().forEach(m => removeConditionalModel(m))
    sceneMembers.conditionalModels.length = 0
  }

  function updateConditionalModels() {
    sceneMembers.conditionalModels.slice().forEach(m => updateConditionalModel(m))
  }

  function updateConditionalModel(conditionalModel: Object3D) {
    conditionalModel.visible = params.displayConditionalEdges;
    conditionalModel.traverse( (c:any) => {

      if ( c.material && c.material.resolution ) {

        sceneMembers.renderer.getSize( c.material.resolution );
        c.material.resolution.multiplyScalar( window.devicePixelRatio );
        c.material.linewidth = params.thickness;

      }

      if ( c.material ) {

        c.visible = c instanceof LineSegments2 ? params.useThickLines : ! params.useThickLines;
        if (c.material.uniforms) {
          c.material.uniforms.diffuse.value.set( params.lineColor );
        }

      }

    } );
  }

  function removeEdgesModel (edgesModel: Object3D) {
    edgesModel.parent?.remove( edgesModel );
      const index = sceneMembers.conditionalModels.indexOf(edgesModel)
      if (index >= 0) {
        sceneMembers.conditionalModels.splice(index, 1)
      }
      edgesModel.traverse( (c: any) => {

        if ( c.isMesh ) {

          c.material.dispose();

        }

      } );
  }

  function removeEdgesModels() {
    sceneMembers.edgesModels.slice().forEach(m => removeEdgesModel(m))
    sceneMembers.edgesModels.length = 0
  }

  function updateEdgeModels() {
    sceneMembers.edgesModels.slice().forEach(m => updateEdgesModel(m))
  }

  function updateEdgesModel(edgesModel: Object3D) {
    edgesModel.traverse( (c: any) => {

      if ( c.material && c.material.resolution ) {

        sceneMembers.renderer.getSize( c.material.resolution );
        c.material.resolution.multiplyScalar( window.devicePixelRatio );
        c.material.linewidth = params.thickness;

      }

      if ( c.material ) {

        c.visible = c instanceof LineSegments2 ? params.useThickLines : ! params.useThickLines;
        c.material.color.set( params.lineColor );

      }

    } );
  }

  function initConditionalModel(originalModel?: Object3D) {

    const modelName = 'conditionalModel-' + originalModel?.name

    let conditionalModel = sceneMembers.scene?.getObjectByName(modelName)

    // remove the original model
    if ( conditionalModel ) {

      removeConditionalModel(conditionalModel)

    }

    // if we have no loaded model then exit
    if ( ! originalModel ) {

      return;

    }

    conditionalModel = originalModel.clone()
    conditionalModel.name = modelName
    conditionalModel.userData.originalModelName = originalModel?.name
    sceneMembers.obj3d?.add( conditionalModel );
    sceneMembers.conditionalModels.push(conditionalModel)
    conditionalModel.visible = false;

    // get all meshes
    const meshes: Mesh[] = [];
    conditionalModel.traverse( (c: any) => {

      if ( c.isMesh ) {

        meshes.push( c );

      }

    } );

    for ( const key in meshes ) {

      const mesh = meshes[ key ];
      const parent = mesh.parent;

      // Remove everything but the position attribute
      const mergedGeom = mesh.geometry.clone().toNonIndexed()
      for ( const key in mergedGeom.attributes ) {

        if ( key !== 'position' ) {

          mergedGeom.deleteAttribute( key );

        }

      }

      // Create the conditional edges geometry and associated material
      let lineGeom:any;
      try {
        lineGeom = new ConditionalEdgesGeometry( BufferGeometryUtils.mergeVertices( mergedGeom ) );
        
      } catch (error) {
        console.info(error)
        continue
      }
      const material = new ShaderMaterial( ConditionalEdgesShader );
      material.uniforms.diffuse.value.set( params.lineColor);

      // Create the line segments objects and replace the mesh
      const line = new LineSegments( lineGeom, material );
      line.position.copy( mesh.position );
      line.scale.copy( mesh.scale );
      line.rotation.copy( mesh.rotation );
      line.matrixAutoUpdate = false;

      const thickLineGeom = new ConditionalLineSegmentsGeometry().fromConditionalEdgesGeometry( lineGeom );
      const thickLines = new LineSegments2( thickLineGeom, new ConditionalLineMaterial( { color: params.lineColor, linewidth: params.thickness } ) );
      thickLines.position.copy( mesh.position );
      thickLines.scale.copy( mesh.scale );
      thickLines.rotation.copy( mesh.rotation );
      thickLines.matrixAutoUpdate = false;

      if (parent) {
        parent.remove( mesh );
        parent.add( line );
        parent.add( thickLines );
      }

    }

  }

  function initEdgesModel(originalModel?: Object3D) {

    const modelName =  'edgesModel-' + originalModel?.name

    let edgesModel = sceneMembers.scene?.getObjectByName(modelName)

    // remove any previous model
    if ( edgesModel ) {

      edgesModel.parent?.remove( edgesModel );
      const index = sceneMembers.edgesModels.indexOf(edgesModel)
      if (index >= 0) {
        sceneMembers.edgesModels.splice(index, 1)
      }
      edgesModel.traverse( (c: any) => {

        if ( c.isMesh ) {

          if ( Array.isArray( c.material ) ) {

            c.material.forEach( (m: any) => m.dispose() );

          } else {

            c.material.dispose();

          }

        }

      } );

    }

    // early out if there's no model loaded
    if ( ! originalModel ) {

      return;

    }


    // store the model and add it to the scene to display
    // behind the lines
    edgesModel = originalModel.clone()
    edgesModel.name = modelName
    edgesModel.userData.originalModelName = originalModel?.name
    sceneMembers.obj3d?.add( edgesModel );
    sceneMembers.edgesModels.push(edgesModel)

    // early out if we're not displaying any type of edge
    if ( params.display === 'NONE' ) {

      edgesModel.visible = false;
      return;

    }

    const meshes: Mesh[] = [];
    edgesModel.traverse( (c: any) => {

      if ( c.isMesh ) {

        meshes.push( c );

      }

    } );

    for ( const key in meshes ) {

      const mesh = meshes[ key ];
      const parent = mesh.parent;


      mesh.geometry = offsetVertices(mesh.geometry)


      let lineGeom: any
      if ( params.display === 'THRESHOLD_EDGES' ) {

        // console.log('dbg: threshold', params.threshold)
        lineGeom = new EdgesGeometry( mesh.geometry, params.threshold );

      } else {

        const mergeGeom = mesh.geometry.clone().toNonIndexed()
        mergeGeom.deleteAttribute( 'uv' );
        mergeGeom.deleteAttribute( 'uv2' );
        try {
          lineGeom = new OutsideEdgesGeometry( BufferGeometryUtils.mergeVertices( mergeGeom, 1e-3 ) );
          
        } catch (error) {
          console.info(error)
          continue
        }

      }

      const line = new LineSegments( lineGeom, new LineBasicMaterial( { color: params.lineColor } ) );
      line.position.copy( mesh.position );
      line.scale.copy( mesh.scale );
      line.rotation.copy( mesh.rotation );
      line.matrixAutoUpdate = false;

      const thickLineGeom = new LineSegmentsGeometry().fromEdgesGeometry( lineGeom );
      const thickLines = new LineSegments2( thickLineGeom, new LineMaterial( { color: params.lineColor, linewidth: params.thickness } ) );
      thickLines.position.copy( mesh.position );
      thickLines.scale.copy( mesh.scale );
      thickLines.rotation.copy( mesh.rotation );
      thickLines.matrixAutoUpdate = false

      if (parent) {
        parent.remove( mesh );
        parent.add( line );
        parent.add( thickLines );
      }
    }

  } 

  function reInitEdgesModels() {
    sceneMembers.edgesModels.forEach(edgesModel => {
      const originalModelName = edgesModel.userData.originalModelName
      if (originalModelName) {
        const originalModel = sceneMembers.obj3d.getObjectByName(originalModelName)
        if (originalModel) {
          initEdgesModel(originalModel)
        } else {
          console.info('[reInitEdgesModels] not found originalModel, maybe it changed or removed')
        }
      } else {
        console.info('[reInitEdgesModels] not found binded originalModelName, maybe a bug')
      }
    })
  }

  function reInitConditionalModels() {
    sceneMembers.conditionalModels.forEach(conditionalModel => {
      const originalModelName = conditionalModel.userData.originalModelName
      if (originalModelName) {
        const originalModel = sceneMembers.obj3d.getObjectByName(originalModelName)
        if (originalModel) {
          initConditionalModel(originalModel)
        } else {
          console.info('[reInitConditionalModels] not found originalModel, maybe it changed or removed')
        }
      } else {
        console.info('[reInitConditionalModels] not found binded originalModelName, maybe a bug')
      }
    })
  }

  function displayOriginalModels(visible: boolean) {
    sceneMembers.edgesModels.forEach(edgesModel => {
      const originalModelName = edgesModel.userData.originalModelName
      if (originalModelName) {
        const originalModel = sceneMembers.obj3d.getObjectByName(originalModelName)
        if (originalModel) {
          originalModel.visible = visible
        } else {
          console.info('[displayOriginalModels] not found originalModel, maybe it changed or removed')
        }
      } else {
        console.info('[displayOriginalModels] not found binded originalModelName, maybe a bug')
      }
    })
  }

  function displayVertexNormals(visible: boolean) {
    const existHelpers = sceneMembers.obj3d.getObjectsByProperty('type', 'VertexNormalsHelper')
    if (existHelpers) {
      existHelpers.slice().forEach(existHelper => {
        removeAndDisposeObject3D(existHelper)
      })
    }
    
    sceneMembers.edgesModels.forEach(edgesModel => {
      const originalModelName = edgesModel.userData.originalModelName
      if (originalModelName) {
        const originalModel = sceneMembers.obj3d.getObjectByName(originalModelName)
        if (originalModel) {
          if (visible) {
            originalModel.traverse((c: any) => {
              if (c.isMesh) {
                const helper = new VertexNormalsHelper(c, 0.1)
                sceneMembers.obj3d.add(helper)
              }
            })
            
          }
          
        } else {
          console.info('[displayVertexNormals] not found originalModel, maybe it changed or removed')
        }
      } else {
        console.info('[displayVertexNormals] not found binded originalModelName, maybe a bug')
      }
    })
  }

  return {
    removeConditionalModel,
    removeConditionalModels,
    updateConditionalModels,
    removeEdgesModel,
    removeEdgesModels,
    updateEdgeModels,
    initConditionalModel,
    initEdgesModel,
    onParamChange,
  }
}