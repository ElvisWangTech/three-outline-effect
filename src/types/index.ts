import { AnimationAction, AnimationMixer, ColorRepresentation, Group, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"
import { OutlineComposor } from "../outline/OutlineComposor"
import { OutlineEffect } from "../outline/OutlineEffect"

export enum OutlineMode {
  Material='Material',
  MaterialOutline='MaterialOutline',
  MaterialOutline1='MaterialOutline1',
  MaterialOutline2='MaterialOutline2'
}

export enum LineDisplay {
  THRESHOLD_EDGES="THRESHOLD_EDGES",
  NORMAL_EDGES='NORMAL_EDGES',
  NONE='NONE',
}

export interface ConditionalPanelParam {
  display: LineDisplay
  threshold: number
  displayConditionalEdges: boolean,
  thickness: number,
  useThickLines: boolean
  lineColor: ColorRepresentation
  reDrawFn?: VoidFunction | undefined
  displayVertexNormals: boolean
  displayOriginalModels: boolean
}

export interface ISceneMembers {
  stats: Stats,
  camera: PerspectiveCamera,
  scene: Scene,
  renderer: WebGLRenderer,
  controls?: OrbitControls,
  sofa: Object3D,
  sofa2: Object3D,
  torus: Object3D,
  cabinet: Object3D,
  cabinetBk: Object3D,
  house: Object3D,
  mixer?: AnimationMixer,
  action?: AnimationAction,
  obj3d: Object3D,
  rootGroup: Group,
  floorGroup: Group,
  composer?: OutlineComposor,
  outlineEffect?: OutlineEffect,
  edgesModels: Object3D[],
  conditionalModels: Object3D[],
}

export interface IOutlineEffectParams {
  defaultThickness?: number
  defaultColor?: number[]
  defaultAlpha?: number
  defaultKeepAlive?: boolean
}