import * as Cesium from 'cesium'

interface AxisOptions {
  scene: Cesium.Scene
  center: Cesium.Cartesian3
}

export enum AxisType {
  X = 0,
  Y = 1,
  Z = 2
}

export default class TranslationAxis {
  public static get DEFAULT() {
    return Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.ZERO)
  }

  private center: Cesium.Cartesian3

  private scene: Cesium.Scene

  public translationAxis: Cesium.Primitive | undefined

  public directions: Cesium.Cartesian3[] = [
    Cesium.Cartesian3.UNIT_X,
    Cesium.Cartesian3.UNIT_Y,
    Cesium.Cartesian3.UNIT_Z
  ]
  public axises: Cesium.Primitive[] = []

  constructor({ scene, center }: AxisOptions) {
    this.center = center

    this.scene = scene
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
    const point = Cesium.Ray.getPoint(ray, 10)
    const polyline = new Cesium.PolylineGeometry({
      positions: [this.center, point],
      width: 10
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

    const axisId: AxisType[] = [AxisType.X, AxisType.Y, AxisType.Z]

    const axisColor = [Cesium.Color.RED, Cesium.Color.GREEN, Cesium.Color.BLUE]

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
      return new Cesium.Primitive({
        geometryInstances: [geometryInstance],
        asynchronous: false,
        appearance: new Cesium.PolylineMaterialAppearance({
          material: Cesium.Material.fromType('PolylineArrow', {
            color: axisColor[index]
          })
        }),
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
    this.translationAxis = this.scene.primitives.add(primitiveCollection)
  }
}
