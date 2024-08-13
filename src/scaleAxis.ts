import * as Cesium from 'cesium'
import BaseAxis, { AxisOptions, AxisType } from './baseAxis'

// interface AxisGeometryInstances {
//   geometryInstance: Cesium.GeometryInstance
// }

export default class ScaleAxis extends BaseAxis {
  constructor({ scene, boundingSphere }: AxisOptions) {
    super({ scene, boundingSphere })
    this.createAxis()
  }

  private createAxisGeometryInstance({
    direction,
    id,
    color
  }: {
    direction: Cesium.Cartesian3
    id: string
    color: Cesium.Color
  }) {
    const ray = new Cesium.Ray(this.center, direction)
    const point = Cesium.Ray.getPoint(ray, this.radius)
    const polyline = new Cesium.PolylineGeometry({
      positions: [this.center, point],
      width: 5
      // vertexFormat: Cesium.PolylineMaterialAppearance.VERTEX_FORMAT
    })
    const polylineGeometryInstance = new Cesium.GeometryInstance({
      geometry: polyline,
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
      },
      id
    })

    const box = new Cesium.BoxGeometry({
      maximum: new Cesium.Cartesian3(0.2, 0.2, 0.2),
      minimum: new Cesium.Cartesian3(-0.2, -0.2, -0.2)
    })
    const boxGeometryInstance = new Cesium.GeometryInstance({
      geometry: box,
      modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(point),
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
      },
      id: `${id}-scale-box`
    })

    return [polylineGeometryInstance, boxGeometryInstance]
  }

  private createAxisPrimitives() {
    const axisId = this.axisId
    const axisColor = this.axisColor

    const geometryInstances = axisId.map((id: AxisType, index) => {
      return this.createAxisGeometryInstance({
        direction: this.directions[index],
        id: id.toString(),
        color: axisColor[index]
      })
    })

    const primitives = geometryInstances.map((geometryInstance, index) => {
      const polylinePrimitive = new Cesium.Primitive({
        geometryInstances: geometryInstance[0] as Cesium.GeometryInstance,
        asynchronous: false,
        appearance: new Cesium.PolylineMaterialAppearance({
          material: Cesium.Material.fromType('Color', {
            color: axisColor[index]
          })
        }),
        depthFailAppearance: new Cesium.PolylineMaterialAppearance({
          material: Cesium.Material.fromType('Color', {
            color: axisColor[index].withAlpha(0.5)
          })
        }),
        releaseGeometryInstances: false
      })

      const boxPrimitive = new Cesium.Primitive({
        geometryInstances: geometryInstance[1],
        asynchronous: false,
        appearance: new Cesium.MaterialAppearance({
          material: Cesium.Material.fromType('Color', {
            color: axisColor[index]
          })
        }),
        depthFailAppearance: new Cesium.MaterialAppearance({
          material: Cesium.Material.fromType('Color', {
            color: axisColor[index].withAlpha(0.5)
          })
        }),
        releaseGeometryInstances: false
      })

      return [polylinePrimitive, boxPrimitive]
    })

    return primitives.flat()
  }

  private createAxis() {
    const primitives = this.createAxisPrimitives()
    primitives.forEach((primitive) => {
      this.scene.primitives.add(primitive)
    })
    this.axises = primitives
  }
}
