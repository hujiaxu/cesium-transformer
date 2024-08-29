import * as Cesium from 'cesium'
import { AxisOptions, AxisType } from './type'

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

  public relativeDirections: Cesium.Cartesian3[] = [
    Cesium.Cartesian3.UNIT_X,
    Cesium.Cartesian3.UNIT_Y,
    Cesium.Cartesian3.UNIT_Z
  ]

  public directionsWithLength: Cesium.Cartesian3[] = [
    Cesium.Cartesian3.UNIT_X,
    Cesium.Cartesian3.UNIT_Y,
    Cesium.Cartesian3.UNIT_Z
  ]

  public rays: Cesium.Ray[] = []

  public endPoints: Cesium.Cartesian3[] = []
  public axises: Cesium.Primitive[] = []

  public boundingSphere: Cesium.BoundingSphere

  public cachedScaleMatrix: Cesium.Matrix4[] = []
  public cachedRotationMatrix: Cesium.Matrix4 = Cesium.Matrix4.IDENTITY.clone()
  public cachedTranslationMatrix: Cesium.Matrix4[] = []

  constructor({ scene, boundingSphere }: AxisOptions) {
    this.center = boundingSphere.center
    this.radius = Math.max(boundingSphere.radius * 0.5, 10)
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

    const rays = directions.map((direction) => {
      return new Cesium.Ray(this.center, direction)
    })
    this.rays = rays

    const endPoints = rays.map((ray) => {
      return Cesium.Ray.getPoint(ray, this.radius)
    })
    this.endPoints = endPoints

    const directionsWithLength = directions.map((direction) => {
      return Cesium.Cartesian3.multiplyByScalar(
        direction.clone(),
        this.radius,
        new Cesium.Cartesian3()
      )
    })
    this.directionsWithLength = directionsWithLength

    this.initCachedMatrix()
  }

  public updateDirections(directions: Cesium.Cartesian3[]) {
    this.directions = directions
  }

  public initCachedMatrix() {
    this.directions.forEach((_, index) => {
      const cachedInitialMatrix = Cesium.Matrix4.IDENTITY.clone()
      this.cachedScaleMatrix[index] = cachedInitialMatrix
      this.cachedTranslationMatrix[index] = cachedInitialMatrix
    })
    this.cachedRotationMatrix = Cesium.Matrix4.IDENTITY.clone()
  }

  public destory() {
    this.axises.forEach((axis) => {
      this.scene.primitives.remove(axis)
    })
  }
}
