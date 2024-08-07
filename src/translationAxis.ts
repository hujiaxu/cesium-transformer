import * as Cesium from 'cesium'
import BaseAxis, { AxisOptions, AxisType } from './baseAxis'

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
    const matrix = Cesium.Transforms.eastNorthUpToFixedFrame(this.center)

    const axisId = this.axisId
    const axisColor = this.axisColor

    const directions = axisId.map((_, index) => {
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

    const geometryInstances = axisId.map((id: AxisType, index) => {
      return this.createAxisGeometryInstance({
        direction: directions[index],
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
    const primitiveCollection = new Cesium.PrimitiveCollection()

    const primitives = this.createAxisPrimitives()
    primitives.forEach((primitive) => {
      primitiveCollection.add(primitive)
    })
    this.axises = primitives
    this.scene.primitives.add(primitiveCollection)
  }
}
