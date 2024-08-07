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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNsYXRpb25BeGlzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3RyYW5zbGF0aW9uQXhpcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxNQUFNLFFBQVEsQ0FBQTtBQUNoQyxPQUFPLFFBQW1DLE1BQU0sWUFBWSxDQUFBO0FBRTVELE1BQU0sQ0FBQyxPQUFPLE9BQU8sZUFBZ0IsU0FBUSxRQUFRO0lBQ25ELFlBQVksRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFlO1FBQ2hELEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFBO1FBQ2hDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQTtJQUNuQixDQUFDO0lBRU8sMEJBQTBCLENBQUMsRUFDakMsU0FBUyxFQUNULEVBQUUsRUFDRixLQUFLLEVBS047UUFDQyxNQUFNLEdBQUcsR0FBRyxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUNsRCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ25ELE1BQU0sUUFBUSxHQUFHLElBQUksTUFBTSxDQUFDLGdCQUFnQixDQUFDO1lBQzNDLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDO1lBQy9CLEtBQUssRUFBRSxFQUFFO1lBQ1QsZ0VBQWdFO1NBQ2pFLENBQUMsQ0FBQTtRQUNGLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLENBQUM7WUFDbkQsUUFBUSxFQUFFLFFBQVE7WUFDbEIsVUFBVSxFQUFFO2dCQUNWLEtBQUssRUFBRSxNQUFNLENBQUMsOEJBQThCLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQzthQUM5RDtZQUNELEVBQUU7U0FDSCxDQUFDLENBQUE7UUFFRixPQUFPLGdCQUFnQixDQUFBO0lBQ3pCLENBQUM7SUFFTyxvQkFBb0I7UUFDMUIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQTtRQUMxQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFBO1FBRWhDLE1BQU0saUJBQWlCLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQVksRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUMzRCxPQUFPLElBQUksQ0FBQywwQkFBMEIsQ0FBQztnQkFDckMsU0FBUyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO2dCQUNqQyxFQUFFLEVBQUUsRUFBRSxDQUFDLFFBQVEsRUFBRTtnQkFDakIsS0FBSyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUM7YUFDeEIsQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7UUFFRixNQUFNLFVBQVUsR0FBRyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUNuRSxNQUFNLFVBQVUsR0FBRyxJQUFJLE1BQU0sQ0FBQywwQkFBMEIsQ0FBQztnQkFDdkQsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLGVBQWUsRUFBRTtvQkFDbEQsS0FBSyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUM7aUJBQ3hCLENBQUM7YUFDSCxDQUFDLENBQUE7WUFDRixNQUFNLG1CQUFtQixHQUFHLElBQUksTUFBTSxDQUFDLDBCQUEwQixDQUFDO2dCQUNoRSxRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFO29CQUNsRCxLQUFLLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUM7aUJBQ3ZDLENBQUM7YUFDSCxDQUFDLENBQUE7WUFFRixPQUFPLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQztnQkFDMUIsaUJBQWlCLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDckMsWUFBWSxFQUFFLEtBQUs7Z0JBQ25CLFVBQVU7Z0JBQ1YsbUJBQW1CO2dCQUNuQix3QkFBd0IsRUFBRSxLQUFLO2FBQ2hDLENBQUMsQ0FBQTtRQUNKLENBQUMsQ0FBQyxDQUFBO1FBRUYsT0FBTyxVQUFVLENBQUE7SUFDbkIsQ0FBQztJQUVPLFVBQVU7UUFDaEIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUE7UUFDOUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFNBQVMsRUFBRSxFQUFFO1lBQy9CLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQTtRQUN0QyxDQUFDLENBQUMsQ0FBQTtRQUNGLElBQUksQ0FBQyxNQUFNLEdBQUcsVUFBVSxDQUFBO0lBQzFCLENBQUM7Q0FDRiJ9