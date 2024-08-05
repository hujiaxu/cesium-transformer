import * as Cesium from 'cesium'

import BaseAxis, { AxisOptions } from './baseAxis'
import TorusGeometry from './torusGeometry'

export default class RotationAxis extends BaseAxis {
  constructor({ scene, boundingSphere }: AxisOptions) {
    super({ scene, boundingSphere })
    this.createRotationAxis()
  }

  private createRotationAxis() {
    const torusGeometryAttributes: TorusGeometry = new TorusGeometry({
      radius: this.radius,
      tube: 0.1,
      radialSegments: 32,
      tubularSegments: 10,
      arc: 2 * Math.PI,
      center: this.center
    })
    const { geometry } = torusGeometryAttributes

    const primitive = new Cesium.Primitive({
      geometryInstances: new Cesium.GeometryInstance({
        geometry: geometry!,
        id: 'rotation-axis',
        attributes: {
          color: Cesium.ColorGeometryInstanceAttribute.fromColor(
            Cesium.Color.BLUE.withAlpha(0.3)
          )
        }
      }),
      appearance: new Cesium.PerInstanceColorAppearance({
        closed: true,
        translucent: false
      }),
      releaseGeometryInstances: false,
      asynchronous: false
    })
    this.scene.primitives.add(primitive)
    console.log('primitive: ', primitive)
  }
}
