import * as Cesium from 'cesium'

import BaseAxis, { AxisOptions, AxisType } from './baseAxis'
import TorusGeometry from './torusGeometry'

export default class RotationAxis extends BaseAxis {
  constructor({ scene, boundingSphere, elementModelMatrix }: AxisOptions) {
    super({ scene, boundingSphere, elementModelMatrix })
    this.createRotationAxis()
  }

  private createRotationAxis() {
    const primitive = new Cesium.Primitive({
      geometryInstances: this.createGeometryInstances(),
      appearance: new Cesium.PerInstanceColorAppearance({
        flat: true,
        translucent: false,
        renderState: {
          depthTest: {
            enabled: false
            // func: Cesium.DepthFunction.LESS_OR_EQUAL
          }
        }
      }),
      releaseGeometryInstances: false,
      asynchronous: false
    })
    this.scene.primitives.add(primitive)
    this.axises = [primitive]
  }

  private createGeometryInstances() {
    const torusGeometryAttributes: TorusGeometry = new TorusGeometry({
      radius: this.radius,
      tube: 0.05,
      radialSegments: 32,
      tubularSegments: 100,
      arc: 2 * Math.PI,
      center: this.center
    })
    const { geometry } = torusGeometryAttributes

    const geometryInstances = this.axisId.map((id: AxisType, index) => {
      const rotationQuaternion = Cesium.Quaternion.fromAxisAngle(
        this.directions[Math.abs(index - 2)],
        Cesium.Math.toRadians(270)
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
      return new Cesium.GeometryInstance({
        geometry: geometry!,
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
