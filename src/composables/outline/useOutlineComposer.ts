import { OutlineComposor } from "../../outline/OutlineComposor";
import { ISceneMembers } from "../../types";

export const useOutlineComposer = () => {
  
  function init(sceneMembers: ISceneMembers) {
    const outlineComposor = new OutlineComposor(sceneMembers.renderer, sceneMembers.camera, sceneMembers.scene);
    outlineComposor.init()
    sceneMembers.composer = outlineComposor
    return outlineComposor
  } 

  return {
    init
  }
}