import * as Cesium from 'cesium';
import BaseAxis from './baseAxis';
// interface AxisGeometryInstances {
//   geometryInstance: Cesium.GeometryInstance
// }
export default class ScaleAxis extends BaseAxis {
    constructor({ scene, boundingSphere }) {
        super({ scene, boundingSphere });
        this.createAxis();
    }
    createAxisGeometryInstance({ direction, id, color }) {
        const ray = new Cesium.Ray(this.center, direction);
        const point = Cesium.Ray.getPoint(ray, this.radius);
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
            modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(point),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NhbGVBeGlzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3NjYWxlQXhpcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxNQUFNLFFBQVEsQ0FBQTtBQUNoQyxPQUFPLFFBQW1DLE1BQU0sWUFBWSxDQUFBO0FBRTVELG9DQUFvQztBQUNwQyw4Q0FBOEM7QUFDOUMsSUFBSTtBQUVKLE1BQU0sQ0FBQyxPQUFPLE9BQU8sU0FBVSxTQUFRLFFBQVE7SUFDN0MsWUFBWSxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQWU7UUFDaEQsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUE7UUFDaEMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO0lBQ25CLENBQUM7SUFFTywwQkFBMEIsQ0FBQyxFQUNqQyxTQUFTLEVBQ1QsRUFBRSxFQUNGLEtBQUssRUFLTjtRQUNDLE1BQU0sR0FBRyxHQUFHLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1FBQ2xELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDbkQsTUFBTSxRQUFRLEdBQUcsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLENBQUM7WUFDM0MsU0FBUyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUM7WUFDL0IsS0FBSyxFQUFFLENBQUM7WUFDUixnRUFBZ0U7U0FDakUsQ0FBQyxDQUFBO1FBQ0YsTUFBTSx3QkFBd0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztZQUMzRCxRQUFRLEVBQUUsUUFBUTtZQUNsQixVQUFVLEVBQUU7Z0JBQ1YsS0FBSyxFQUFFLE1BQU0sQ0FBQyw4QkFBOEIsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO2FBQzlEO1lB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