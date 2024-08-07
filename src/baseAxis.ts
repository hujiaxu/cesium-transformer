import * as Cesium from 'cesium'

export interface AxisOptions {
  scene: Cesium.Scene
  boundingSphere: Cesium.BoundingSphere
}

export enum AxisType {
  X = 0,
  Y = 1,
  Z = 2
}

export default class BaseAxis {
  public center: Cesium.Cartesian3

  public radius: number

  public scene: Cesium.Scene

  public axisId: AxisType[] = [AxisType.X, AxisType.Y, AxisType.Z]

  public axisColor = [Cesium.Color.RED, Cesium.Color.GREEN, Cesium.Color.BLUE]

  public directions: Cesium.Cartesian3[] = [
    Cesium.Cartesian3.UNIT_X,
    Cesium.Cartesian3.UNIT_Y,
    Cesium.Cartesian3.UNIT_Z
  ]
  public axises: Cesium.Primitive[] = []

  public boundingSphere: Cesium.BoundingSphere

  constructor({ scene, boundingSphere }: AxisOptions) {
    this.center = boundingSphere.center
    this.radius = boundingSphere.radius
    this.boundingSphere = boundingSphere

    this.scene = scene
    const matrix = Cesium.Transforms.eastNorthUpToFixedFrame(this.center)
    const directions = this.axisId.map((_, index) => {
      const direction4 = Cesium.Matrix4.getColumn(
        matrix,
        index,
        new Cesium.Cartesian4()
      )
      return Cesium.Cartesian3.fromCartesian4(
        direction4,
        new Cesium.Cartesian3()
      )
    })
    this.directions = directions
  }

  public destory() {
    this.axises.forEach((axis) => {
      this.scene.primitives.remove(axis)
    })
  }
}
