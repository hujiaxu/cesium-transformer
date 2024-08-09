import * as Cesium from 'cesium';
export default class TorusGeometry {
    constructor(torusGeometryOptions) {
        // public bitangent: Cesium.GeometryAttribute | undefined
        // public tangent: Cesium.GeometryAttribute | undefined
        // public color: Cesium.GeometryAttribute | undefined
        this.primitiveType = Cesium.PrimitiveType.TRIANGLES;
        this.indices = new Uint16Array();
        // super()
        this.createGeometry(torusGeometryOptions);
    }
    createGeometry({ radius, tube, radialSegments, tubularSegments, arc, center }) {
        radialSegments = Math.floor(radialSegments);
        tubularSegments = Math.floor(tubularSegments);
        if (!arc)
            arc = 2 * Math.PI;
        const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
        const positions = [];
        const indices = [];
        const normals = [];
        const st = [];
        const bitangents = [];
        const tangents = [];
        for (let j = 0; j <= radialSegments; j++) {
            for (let i = 0; i <= tubularSegments; i++) {
                const u = (i / tubularSegments) * arc;
                const v = (j / radialSegments) * Math.PI * 2;
                const x = (radius + tube * Math.cos(v)) * Math.cos(u);
                const z = (radius + tube * Math.cos(v)) * Math.sin(u);
                const y = tube * Math.sin(v);
                const pos = new Cesium.Cartesian3(x, y, z);
                const worldPos = Cesium.Matrix4.multiplyByPoint(modelMatrix, pos, new Cesium.Cartesian3());
                positions.push(worldPos);
                const cIn = Cesium.Cartesian3.ZERO.clone();
                cIn.x = radius * Math.cos(u);
                cIn.z = radius * Math.sin(u);
                const normal = Cesium.Cartesian3.subtract(pos, cIn, new Cesium.Cartesian3());
                Cesium.Cartesian3.normalize(Cesium.Matrix4.multiplyByPoint(modelMatrix, normal, new Cesium.Cartesian3()), normal);
                normals.push(normal);
                st.push(new Cesium.Cartesian2(i / radialSegments, j / tubularSegments));
                const tangent = Cesium.Cartesian3.cross(normal, Cesium.Cartesian3.UNIT_Z, new Cesium.Cartesian3());
                Cesium.Cartesian3.normalize(tangent, tangent);
                tangents.push(tangent);
                const bitangent = Cesium.Cartesian3.cross(tangent, normal, new Cesium.Cartesian3());
                Cesium.Cartesian3.normalize(bitangent, bitangent);
                bitangents.push(bitangent);
            }
        }
        for (let j = 1; j <= radialSegments; j++) {
            for (let i = 1; i <= tubularSegments; i++) {
                // indices
                const a = (tubularSegments + 1) * j + i - 1;
                const b = (tubularSegments + 1) * (j - 1) + i - 1;
                const c = (tubularSegments + 1) * (j - 1) + i;
                const d = (tubularSegments + 1) * j + i;
                // faces
                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }
        const posFloatArray = new Float64Array(Cesium.Cartesian3.packArray(positions));
        const positionsAttr = new Cesium.GeometryAttribute({
            componentDatatype: Cesium.ComponentDatatype.DOUBLE,
            componentsPerAttribute: 3,
            values: posFloatArray
        });
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
        };
        this.indices = new Uint16Array(indices);
        this.geometry = new Cesium.Geometry({
            attributes: this.attributes,
            indices: this.indices,
            primitiveType: Cesium.PrimitiveType.TRIANGLES,
            boundingSphere: Cesium.BoundingSphere.fromVertices(Cesium.Cartesian3.packArray(positions))
        });
        this.geometry = Cesium.GeometryPipeline.compressVertices(this.geometry);
        this.geometry = Cesium.GeometryPipeline.computeNormal(this.geometry);
        // this.geometry = Cesium.GeometryPipeline.computeTangentAndBitangent(
        //   this.geometry
        // )
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9ydXNHZW9tZXRyeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy90b3J1c0dlb21ldHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sS0FBSyxNQUFNLE1BQU0sUUFBUSxDQUFBO0FBRWhDLE1BQU0sQ0FBQyxPQUFPLE9BQU8sYUFBYTtJQVdoQyxZQUFZLG9CQUEwQztRQUx0RCx5REFBeUQ7UUFDekQsdURBQXVEO1FBQ3ZELHFEQUFxRDtRQUM5QyxrQkFBYSxHQUF5QixNQUFNLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQTtRQUNwRSxZQUFPLEdBQWdCLElBQUksV0FBVyxFQUFFLENBQUE7UUFFN0MsVUFBVTtRQUNWLElBQUksQ0FBQyxjQUFjLENBQUMsb0JBQW9CLENBQUMsQ0FBQTtJQUMzQyxDQUFDO0lBRU8sY0FBYyxDQUFDLEVBQ3JCLE1BQU0sRUFDTixJQUFJLEVBQ0osY0FBYyxFQUNkLGVBQWUsRUFDZixHQUFHLEVBQ0gsTUFBTSxFQUNlO1FBQ3JCLGNBQWMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFBO1FBQzNDLGVBQWUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFBO1FBRTdDLElBQUksQ0FBQyxHQUFHO1lBQUUsR0FBRyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFBO1FBQzNCLE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLENBQUE7UUFFckUsTUFBTSxTQUFTLEdBQXdCLEVBQUUsQ0FBQTtRQUN6QyxNQUFNLE9BQU8sR0FBYSxFQUFFLENBQUE7UUFDNUIsTUFBTSxPQUFPLEdBQXdCLEVBQUUsQ0FBQTtRQUN2QyxNQUFNLEVBQUUsR0FBd0IsRUFBRSxDQUFBO1FBQ2xDLE1BQU0sVUFBVSxHQUF3QixFQUFFLENBQUE7UUFDMUMsTUFBTSxRQUFRLEdBQXdCLEVBQUUsQ0FBQTtRQUV4QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksY0FBYyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDekMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLGVBQWUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO2dCQUMxQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxlQUFlLENBQUMsR0FBRyxHQUFHLENBQUE7Z0JBQ3JDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFBO2dCQUU1QyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7Z0JBQ3JELE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQkFDckQsTUFBTSxDQUFDLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7Z0JBRTVCLE1BQU0sR0FBRyxHQUFHLElBQUksTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO2dCQUUxQyxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FDN0MsV0FBVyxFQUNYLEdBQUcsRUFDSCxJQUFJLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FDeEIsQ0FBQTtnQkFDRCxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBO2dCQUV4QixNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FB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