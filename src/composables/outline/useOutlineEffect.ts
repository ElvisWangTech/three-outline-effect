import { OutlineEffect } from "../../outline/OutlineEffect";
import { ISceneMembers } from "../../types";

export const useOutlineEffect = () => {
  function init (sceneMembers: ISceneMembers) {
    const outlineEffect = new OutlineEffect(sceneMembers.renderer)
    sceneMembers.outlineEffect = outlineEffect
    return outlineEffect
  }

  return {
    init
  }
}