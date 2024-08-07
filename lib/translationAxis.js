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
        const matrix = Cesium.Transforms.eastNorthUpToFixedFrame(this.center);
        const axisId = this.axisId;
        const axisColor = this.axisColor;
        const directions = axisId.map((_, index) => {
            const direction4 = Cesium.Matrix4.getColumn(matrix, index, new Cesium.Cartesian4());
            return Cesium.Cartesian3.fromCartesian4(direction4, new Cesium.Cartesian3());
        });
        this.directions = directions;
        const geometryInstances = axisId.map((id, index) => {
            return this.createAxisGeometryInstance({
                direction: directions[index],
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
        const primitiveCollection = new Cesium.PrimitiveCollection();
        const primitives = this.createAxisPrimitives();
        primitives.forEach((primitive) => {
            primitiveCollection.add(primitive);
        });
        this.axises = primitives;
        this.scene.primitives.add(primitiveCollection);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNsYXRpb25BeGlzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3RyYW5zbGF0aW9uQXhpcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxNQUFNLFFBQVEsQ0FBQTtBQUNoQyxPQUFPLFFBQW1DLE1BQU0sWUFBWSxDQUFBO0FBRTVELE1BQU0sQ0FBQyxPQUFPLE9BQU8sZUFBZ0IsU0FBUSxRQUFRO0lBQ25ELFlBQVksRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFlO1FBQ2hELEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFBO1FBQ2hDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQTtJQUNuQixDQUFDO0lBRU8sMEJBQTBCLENBQUMsRUFDakMsU0FBUyxFQUNULEVBQUUsRUFDRixLQUFLLEVBS047UUFDQyxNQUFNLEdBQUcsR0FBRyxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUNsRCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ25ELE1BQU0sUUFBUSxHQUFHLElBQUksTUFBTSxDQUFDLGdCQUFnQixDQUFDO1lBQzNDLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDO1lBQy9CLEtBQUssRUFBRSxFQUFFO1lBQ1QsZ0VBQWdFO1NBQ2pFLENBQUMsQ0FBQTtRQUNGLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLENBQUM7WUFDbkQsUUFBUSxFQUFFLFFBQVE7WUFDbEIsVUFBVSxFQUFFO2dCQUNWLEtBQUssRUFBRSxNQUFNLENBQUMsOEJBQThCLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQzthQUM5RDtZQUNELEVBQUU7U0FDSCxDQUFDLENBQUE7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