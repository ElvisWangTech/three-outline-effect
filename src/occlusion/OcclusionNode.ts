
import { Color, Node, NodeFrame, NodeUpdateType, Object3D, uniform } from "three/webgpu";
export class OcclusionNode extends Node {
  uniformNode: any;
  testObject: any;
  normalColor: Color;
  occludedColor: Color;

  constructor( testObject: Object3D, normalColor: Color, occludedColor: Color ) {

    super( 'vec3' );

    this.updateType = NodeUpdateType.OBJECT;

    this.uniformNode = uniform( new Color() );

    this.testObject = testObject;
    this.normalColor = normalColor;
    this.occludedColor = occludedColor;

  }

  async update( frame: NodeFrame ) {

    const isOccluded = frame.renderer?.isOccluded( this.testObject );

    this.uniformNode.value.copy( isOccluded ? this.occludedColor : this.normalColor );

  }

  setup( /* builder */ ) {

    return this.uniformNode;

  }

}