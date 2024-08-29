import * as Cesium from 'cesium';
import BaseAxis from './baseAxis';
export default class TranslationAxis extends BaseAxis {
    constructor({ scene, boundingSphere }) {
        super({ scene, boundingSphere });
        this.createAxis();
    }
    createAxisGeometryInstance({ direction, id, color }) {
        const ray = new Cesium.Ray(this.center, direction);
        const point = Cesium.Ray.getPoint(ray, this.radius);
        const polyline = new Cesium.PolylineGeometry({
            positions: [this.center, point],
            width: 15
            // vertexFormat: Cesium.PolylineMaterialAppearance.VERTEX_FORMAT
        });
        const geometryInstance = new Cesium.GeometryInstance({
            geometry: polyline,
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(color)
            },
            id
        });
        return geometryInstance;
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
            const appearance = new Cesium.PolylineMaterialAppearance({
                material: Cesium.Material.fromType('PolylineArrow', {
                    color: axisColor[index]
                })
            });
            const depthFailAppearance = new Cesium.PolylineMaterialAppearance({
                material: Cesium.Material.fromType('PolylineArrow', {
                    color: axisColor[index].withAlpha(0.5)
                })
            });
            return new Cesium.Primitive({
                geometryInstances: [geometryInstance],
                asynchronous: false,
                appearance,
                depthFailAppearance,
                releaseGeometryInstances: false
            });
        });
        return primitives;
    }
    createAxis() {
        const primitives = this.createAxisPrimitives();
        primitives.forEach((primitive) => {
            this.scene.primitives.add(primitive);
        });
        this.axises = primitives;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNsYXRpb25BeGlzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3RyYW5zbGF0aW9uQXhpcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxNQUFNLFFBQVEsQ0FBQTtBQUNoQyxPQUFPLFFBQVEsTUFBTSxZQUFZLENBQUE7QUFHakMsTUFBTSxDQUFDLE9BQU8sT0FBTyxlQUFnQixTQUFRLFFBQVE7SUFDbkQsWUFBWSxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQWU7UUFDaEQsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUE7UUFDaEMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO0lBQ25CLENBQUM7SUFFTywwQkFBMEIsQ0FBQyxFQUNqQyxTQUFTLEVBQ1QsRUFBRSxFQUNGLEtBQUssRUFLTjtRQUNDLE1BQU0sR0FBRyxHQUFHLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1FBQ2xELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDbkQsTUFBTSxRQUFRLEdBQUcsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLENBQUM7WUFDM0MsU0FBUyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUM7WUFDL0IsS0FBSyxFQUFFLEVBQUU7WUFDVCxnRUFBZ0U7U0FDakUsQ0FBQyxDQUFBO1FBQ0YsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztZQUNuRCxRQUFRLEVBQUUsUUFBUTtZQUNsQixVQUFVLEVBQUU7Z0JBQ1YsS0FBSyxFQUFFLE1BQU0sQ0FBQyw4QkFBOEIsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO2FBQzlEO1lBQ0QsRUFBRTtTQUNILENBQUMsQ0FBQTtRQUVGLE9BQU8sZ0JBQWdCLENBQUE7SUFDekIsQ0FBQztJQUVPLG9CQUFvQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFBO1FBQzFCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUE7UUFFaEMsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBWSxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQzNELE9BQU8sSUFBSSxDQUFDLDBCQUEwQixDQUFDO2dCQUNyQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7Z0JBQ2pDLEVBQUUsRUFBRSxFQUFFLENBQUMsUUFBUSxFQUFFO2dCQUNqQixLQUFLLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQzthQUN4QixDQUFDLENBQUE7UUFDSixDQUFDLENBQUMsQ0FBQTtRQUVGLE1BQU0sVUFBVSxHQUFHLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDLGdCQUFnQixFQUFFLEtBQUssRUFBRSxFQUFFO1lBQ25FLE1BQU0sVUFBVSxHQUFHLElBQUksTUFBTSxDQUFDLDBCQUEwQixDQUFDO2dCQUN2RCxRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFO29CQUNsRCxLQUFLLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQztpQkFDeEIsQ0FBQzthQUNILENBQUMsQ0FBQTtZQUNGLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxNQUFNLENBQUMsMEJBQTBCLENBQUM7Z0JBQ2hFLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUU7b0JBQ2xELEtBQUssRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQztpQkFDdkMsQ0FBQzthQUNILENBQUMsQ0FBQTtZQUVGLE9BQU8sSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDO2dCQUMxQixpQkFBaUIsRUFBRSxDQUFDLGdCQUFnQixDQUFDO2dCQUNyQyxZQUFZLEVBQUUsS0FBSztnQkFDbkIsVUFBVTtnQkFDVixtQkFBbUI7Z0JBQ25CLHdCQUF3QixFQUFFLEtBQUs7YUFDaEMsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7UUFFRixPQUFPLFVBQVUsQ0FBQTtJQUNuQixDQUFDO0lBRU8sVUFBVTtRQUNoQixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQTtRQUM5QyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxFQUFFLEVBQUU7WUFDL0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFBO1FBQ3RDLENBQUMsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUE7SUFDMUIsQ0FBQztDQUNGIn0=