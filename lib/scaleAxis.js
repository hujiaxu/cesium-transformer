import * as Cesium from 'cesium';
import BaseAxis from './baseAxis';
// interface AxisGeometryInstances {
//   geometryInstance: Cesium.GeometryInstance
// }
export default class ScaleAxis extends BaseAxis {
    constructor({ scene, boundingSphere }) {
        super({ scene, boundingSphere });
        // const directions = [
        //   Cesium.Cartesian3.UNIT_X,
        //   Cesium.Cartesian3.UNIT_Y,
        //   Cesium.Cartesian3.UNIT_Z
        // ]
        // this.updateDirections(directions)
        this.createAxis();
    }
    createAxisGeometryInstance({ direction, id, color }) {
        const ray = new Cesium.Ray(this.center, direction);
        const point = Cesium.Ray.getPoint(ray, this.radius);
        const boxEndPoint = Cesium.Ray.getPoint(ray, this.radius * 0.9);
        const polyline = new Cesium.PolylineGeometry({
            positions: [this.center, point],
            width: 5
            // vertexFormat: Cesium.PolylineMaterialAppearance.VERTEX_FORMAT
        });
        const polylineGeometryInstance = new Cesium.GeometryInstance({
            geometry: polyline,
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
            },
            id
        });
        const box = new Cesium.BoxGeometry({
            maximum: new Cesium.Cartesian3(0.2, 0.2, 0.2),
            minimum: new Cesium.Cartesian3(-0.2, -0.2, -0.2)
        });
        const boxGeometryInstance = new Cesium.GeometryInstance({
            geometry: box,
            // modelMatrix: Cesium.Matrix4.fromTranslation(point),
            modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(boxEndPoint),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
            },
            id: `${id}-scale-box`
        });
        return [polylineGeometryInstance, boxGeometryInstance];
    }
    createAxisPrimitives() {
        const axisId = this.axisId;
        const axisColor = this.axisColor;
        const geometryInstances = axisId.map((id, index) => {
            return this.createAxisGeometryInstance({
                direction: this.directions[index],
                id: id.toString(),
                color: axisColor[index]
            });
        });
        const primitives = geometryInstances.map((geometryInstance, index) => {
            const polylinePrimitive = new Cesium.Primitive({
                geometryInstances: geometryInstance[0],
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
            });
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
            });
            return [polylinePrimitive, boxPrimitive];
        });
        return primitives.flat();
    }
    createAxis() {
        const primitives = this.createAxisPrimitives();
        primitives.forEach((primitive) => {
            this.scene.primitives.add(primitive);
        });
        this.axises = primitives;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NhbGVBeGlzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3NjYWxlQXhpcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxNQUFNLFFBQVEsQ0FBQTtBQUNoQyxPQUFPLFFBQW1DLE1BQU0sWUFBWSxDQUFBO0FBRTVELG9DQUFvQztBQUNwQyw4Q0FBOEM7QUFDOUMsSUFBSTtBQUVKLE1BQU0sQ0FBQyxPQUFPLE9BQU8sU0FBVSxTQUFRLFFBQVE7SUFDN0MsWUFBWSxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQWU7UUFDaEQsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUE7UUFDaEMsdUJBQXVCO1FBQ3ZCLDhCQUE4QjtRQUM5Qiw4QkFBOEI7UUFDOUIsNkJBQTZCO1FBQzdCLElBQUk7UUFDSixvQ0FBb0M7UUFDcEMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO0lBQ25CLENBQUM7SUFFTywwQkFBMEIsQ0FBQyxFQUNqQyxTQUFTLEVBQ1QsRUFBRSxFQUNGLEtBQUssRUFLTjtRQUNDLE1BQU0sR0FBRyxHQUFHLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1FBQ2xELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDbkQsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUE7UUFDL0QsTUFBTSxRQUFRLEdBQUcsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLENBQUM7WUFDM0MsU0FBUyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUM7WUFDL0IsS0FBSyxFQUFFLENBQUM7WUFDUixnRUFB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