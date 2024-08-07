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
