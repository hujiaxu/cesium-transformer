import * as Cesium from 'cesium'

import BaseAxis, { AxisOptions, AxisType } from './baseAxis'
import TorusGeometry from './torusGeometry'

export default class RotationAxis extends BaseAxis {
  constructor({ scene, boundingSphere }: AxisOptions) {
    super({ scene, boundingSphere })
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
    this.axises = this.scene.primitives.add(primitive)
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
      // const rotationQuaternion = Cesium.Quaternion.fromAxisAngle(
      //   Cesium.Cartesian3.UNIT_Z,
      //   Cesium.Math.PI_OVER_TWO
      // )
      // const hpr = Cesium.HeadingPitchRoll.fromQuaternion(rotationQuaternion)
      // console.log('hpr: ', hpr)
      // const hpr = new Cesium.HeadingPitchRoll(0, 0, 0)
      // const modelMatrix = Cesium.Matrix4.multiplyByMatrix3(
      //   Cesium.Matrix4.IDENTITY,
      //   Cesium.Matrix3.fromQuaternion(rotationQuaternion),
      //   new Cesium.Matrix4()
      // )
      const modelMatrix = Cesium.Matrix4.IDENTITY
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
