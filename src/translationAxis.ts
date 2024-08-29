import * as Cesium from 'cesium'
import BaseAxis from './baseAxis'
import { AxisOptions, AxisType } from './type'

export default class TranslationAxis extends BaseAxis {
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
      width: 15
      // vertexFormat: Cesium.PolylineMaterialAppearance.VERTEX_FORMAT
    })
    const geometryInstance = new Cesium.GeometryInstance({
      geometry: polyline,
      attributes: {
        color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
      },
      id
    })

    return geometryInstance
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
      const appearance = new Cesium.PolylineMaterialAppearance({
        material: Cesium.Material.fromType('PolylineArrow', {
          color: axisColor[index]
        })
      })
      const depthFailAppearance = new Cesium.PolylineMaterialAppearance({
        material: Cesium.Material.fromType('PolylineArrow', {
          color: axisColor[index].withAlpha(0.5)
        })
      })

      return new Cesium.Primitive({
        geometryInstances: [geometryInstance],
        asynchronous: false,
        appearance,
        depthFailAppearance,
        releaseGeometryInstances: false
      })
    })

    return primitives
  }

  private createAxis() {
    const primitives = this.createAxisPrimitives()
    primitives.forEach((primitive) => {
      this.scene.primitives.add(primitive)
    })
    this.axises = primitives
  }
}
