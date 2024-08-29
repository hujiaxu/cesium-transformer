import * as Cesium from 'cesium'

export interface TorusGeometryOptions {
  radius: number
  tube: number
  radialSegments: number
  tubularSegments: number
  arc: number
  center: Cesium.Cartesian3
}

export enum ModeCollection {
  TRANSLATION = 'translation',
  ROTATION = 'rotation',
  SCALE = 'scale'
}
export const MODES = [
  ModeCollection.TRANSLATION,
  ModeCollection.ROTATION,
  ModeCollection.SCALE
]

export type elementType =
  | Cesium.Primitive
  | Cesium.Cesium3DTileset
  | Cesium.Model

export interface TransformerConstructorOptions {
  scene: Cesium.Scene

  element: elementType

  boundingSphere: Cesium.BoundingSphere
}

export interface PickObjectInterface {
  primitive: Cesium.Primitive

  id: AxisType
}

export interface AxisOptions {
  scene: Cesium.Scene
  boundingSphere: Cesium.BoundingSphere
  elementModelMatrix?: Cesium.Matrix4
}

export enum AxisType {
  X = 0,
  Y = 1,
  Z = 2
}
