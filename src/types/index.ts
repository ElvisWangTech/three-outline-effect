import { ColorRepresentation } from "three"

export enum OutlineMode {
  Material='Material',
  MaterialOutline='MaterialOutline',
  MaterialOutline1='MaterialOutline1'
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