import * as Cesium from 'cesium'

import BaseAxis, { AxisOptions, AxisType } from './baseAxis'

export default class RotationAxis extends BaseAxis {
  public cachedModelMatrixs: Cesium.Matrix4[] = []

  constructor({ scene, boundingSphere, elementModelMatrix }: AxisOptions) {
    super({ scene, boundingSphere, elementModelMatrix })
    this.createRotationAxis()
  }

  private createRotationAxis() {
    const instances = this.createGeometryInstances()
    const primitives = instances.map((instance, index) => {
      return new Cesium.Primitive({
        geometryInstances: [instance],
        appearance: new Cesium.PolylineMaterialAppearance({
          material: Cesium.Material.fromType('Color', {
            color: this.axisColor[index]
          })
        }),
        depthFailAppearance: new Cesium.PolylineMaterialAppearance({
          material: Cesium.Material.fromType('Color', {
            color: this.axisColor[index].withAlpha(0.5)
          })
        }),
        asynchronous: false,
        releaseGeometryInstances: false,
        modelMatrix: Cesium.Matrix4.IDENTITY.clone()
      })
    })
    primitives.forEach((primitive) => {
      this.scene.primitives.add(primitive)
    })

    this.axises = primitives
  }

  private createTorusGeometry() {
    const center = this.center

    const radius = this.radius

    const numPoints = Math.floor(this.radius * 100)
    const positions = []

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Cesium.Math.TWO_PI
      const x = radius * Math.cos(angle)
      const y = radius * Math.sin(angle)
      const point = Cesium.Cartesian3.fromElements(x, 0, y)

      const rotatedPoint = Cesium.Matrix4.multiplyByPoint(
        Cesium.Transforms.eastNorthUpToFixedFrame(center),
        point,
        new Cesium.Cartesian3()
      )
      positions.push(rotatedPoint)
    }

    positions.push(positions[0])

    const polylineGeometry = new Cesium.PolylineGeometry({
      positions: positions,
      width: 5.0
    })

    return polylineGeometry
  }

  private createGeometryInstances() {
    const geometryInstances = this.axisId.map((id: AxisType, index) => {
      const rotationQuaternion = Cesium.Quaternion.fromAxisAngle(
        this.directions[Math.abs(index - 2)],
        Cesium.Math.toRadians(90)
      )

      const translationToCenter = Cesium.Matrix4.fromTranslation(this.center)
      const rotationMatrix = Cesium.Matrix4.fromRotationTranslation(
        Cesium.Matrix3.fromQuaternion(rotationQuaternion)
      )
      const translationBack = Cesium.Matrix4.fromTranslation(
        Cesium.Cartesian3.negate(this.center, new Cesium.Cartesian3())
      )
      const modelMatrix = Cesium.Matrix4.IDENTITY.clone()

      Cesium.Matrix4.multiply(modelMatrix, translationToCenter, modelMatrix)
      Cesium.Matrix4.multiply(modelMatrix, rotationMatrix, modelMatrix)
      Cesium.Matrix4.multiply(modelMatrix, translationBack, modelMatrix)

      this.cachedModelMatrixs[index] = modelMatrix
      return new Cesium.GeometryInstance({
        geometry: this.createTorusGeometry(),
        id: id.toString(),
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            this.axisColor[index]
          )
        },
        modelMatrix
      })
    })

    return geometryInstances
  }
}
