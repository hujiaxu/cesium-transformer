import { TorusGeometryOptions } from './type'
import * as Cesium from 'cesium'

export default class TorusGeometry {
  public geometry: Cesium.Geometry | undefined
  public attributes: any
  public positions: Cesium.GeometryAttribute | undefined
  public normals: Cesium.GeometryAttribute | undefined
  public st: Cesium.GeometryAttribute | undefined
  // public bitangent: Cesium.GeometryAttribute | undefined
  // public tangent: Cesium.GeometryAttribute | undefined
  // public color: Cesium.GeometryAttribute | undefined
  public primitiveType: Cesium.PrimitiveType = Cesium.PrimitiveType.TRIANGLES
  public indices: Uint16Array = new Uint16Array()
  constructor(torusGeometryOptions: TorusGeometryOptions) {
    // super()
    this.createGeometry(torusGeometryOptions)
  }

  private createGeometry({
    radius,
    tube,
    radialSegments,
    tubularSegments,
    arc,
    center
  }: TorusGeometryOptions) {
    radialSegments = Math.floor(radialSegments)
    tubularSegments = Math.floor(tubularSegments)

    if (!arc) arc = 2 * Math.PI
    const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center)

    const positions: Cesium.Cartesian3[] = []
    const indices: number[] = []
    const normals: Cesium.Cartesian3[] = []
    const st: Cesium.Cartesian2[] = []
    const bitangents: Cesium.Cartesian3[] = []
    const tangents: Cesium.Cartesian3[] = []

    for (let j = 0; j <= radialSegments; j++) {
      for (let i = 0; i <= tubularSegments; i++) {
        const u = (i / tubularSegments) * arc
        const v = (j / radialSegments) * Math.PI * 2

        const x = (radius + tube * Math.cos(v)) * Math.cos(u)
        const z = (radius + tube * Math.cos(v)) * Math.sin(u)
        const y = tube * Math.sin(v)

        const pos = new Cesium.Cartesian3(x, y, z)

        const worldPos = Cesium.Matrix4.multiplyByPoint(
          modelMatrix,
          pos,
          new Cesium.Cartesian3()
        )
        positions.push(worldPos)

        const cIn = Cesium.Cartesian3.ZERO.clone()

        cIn.x = radius * Math.cos(u)
        cIn.z = radius * Math.sin(u)

        const normal = Cesium.Cartesian3.subtract(
          pos,
          cIn,
          new Cesium.Cartesian3()
        )
        Cesium.Cartesian3.normalize(
          Cesium.Matrix4.multiplyByPoint(
            modelMatrix,
            normal,
            new Cesium.Cartesian3()
          ),
          normal
        )

        normals.push(normal)
        st.push(new Cesium.Cartesian2(i / radialSegments, j / tubularSegments))

        const tangent = Cesium.Cartesian3.cross(
          normal,
          Cesium.Cartesian3.UNIT_Z,
          new Cesium.Cartesian3()
        )
        Cesium.Cartesian3.normalize(tangent, tangent)
        tangents.push(tangent)

        const bitangent = Cesium.Cartesian3.cross(
          tangent,
          normal,
          new Cesium.Cartesian3()
        )
        Cesium.Cartesian3.normalize(bitangent, bitangent)
        bitangents.push(bitangent)
      }
    }

    for (let j = 1; j <= radialSegments; j++) {
      for (let i = 1; i <= tubularSegments; i++) {
        // indices

        const a = (tubularSegments + 1) * j + i - 1
        const b = (tubularSegments + 1) * (j - 1) + i - 1
        const c = (tubularSegments + 1) * (j - 1) + i
        const d = (tubularSegments + 1) * j + i

        // faces

        indices.push(a, b, d)
        indices.push(b, c, d)
      }
    }

    const posFloatArray = new Float64Array(
      Cesium.Cartesian3.packArray(positions)
    )
    const positionsAttr = new Cesium.GeometryAttribute({
      componentDatatype: Cesium.ComponentDatatype.DOUBLE,
      componentsPerAttribute: 3,
      values: posFloatArray
    })

    // const normalsAttr = new Cesium.GeometryAttribute({
    //   componentDatatype: Cesium.ComponentDatatype.FLOAT,
    //   componentsPerAttribute: 3,
    //   values: new Float32Array(Cesium.Cartesian3.packArray(normals))
    // })

    // const stAttr = new Cesium.GeometryAttribute({
    //   componentDatatype: Cesium.ComponentDatatype.FLOAT,
    //   componentsPerAttribute: 2,
    //   values: new Float32Array(Cesium.Cartesian2.packArray(st))
    // })

    // const tangentsAttr = new Cesium.GeometryAttribute({
    //   componentDatatype: Cesium.ComponentDatatype.FLOAT,
    //   componentsPerAttribute: 3,
    //   values: new Float32Array(Cesium.Cartesian3.packArray(tangents))
    // })

    // const bitangentsAttr = new Cesium.GeometryAttribute({
    //   componentDatatype: Cesium.ComponentDatatype.FLOAT,
    //   componentsPerAttribute: 3,
    //   values: new Float32Array(Cesium.Cartesian3.packArray(bitangents))
    // })

    this.attributes = {
      position: positionsAttr
      // normal: normalsAttr
      // st: stAttr
      // tangent: tangentsAttr,
      // bitangent: bitangentsAttr
    }
    this.indices = new Uint16Array(indices)

    this.geometry = new Cesium.Geometry({
      attributes: this.attributes,
      indices: this.indices,
      primitiveType: Cesium.PrimitiveType.TRIANGLES,
      boundingSphere: Cesium.BoundingSphere.fromVertices(
        Cesium.Cartesian3.packArray(positions)
      )
    })
    this.geometry = Cesium.GeometryPipeline.compressVertices(this.geometry)
    this.geometry = Cesium.GeometryPipeline.computeNormal(this.geometry)
    // this.geometry = Cesium.GeometryPipeline.computeTangentAndBitangent(
    //   this.geometry
    // )
    console.log('this.geometry: ', this.geometry)
  }
}
