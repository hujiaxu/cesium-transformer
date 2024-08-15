import * as Cesium from 'cesium';
import BaseAxis from './baseAxis';
// interface AxisGeometryInstances {
//   geometryInstance: Cesium.GeometryInstance
// }
export default class ScaleAxis extends BaseAxis {
    constructor({ scene, boundingSphere }) {
        super({ scene, boundingSphere });
        const directions = [
            Cesium.Cartesian3.UNIT_X,
            Cesium.Cartesian3.UNIT_Y,
            Cesium.Cartesian3.UNIT_Z
        ];
        this.updateDirections(directions);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NhbGVBeGlzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3NjYWxlQXhpcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxNQUFNLFFBQVEsQ0FBQTtBQUNoQyxPQUFPLFFBQW1DLE1BQU0sWUFBWSxDQUFBO0FBRTVELG9DQUFvQztBQUNwQyw4Q0FBOEM7QUFDOUMsSUFBSTtBQUVKLE1BQU0sQ0FBQyxPQUFPLE9BQU8sU0FBVSxTQUFRLFFBQVE7SUFDN0MsWUFBWSxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQWU7UUFDaEQsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUE7UUFDaEMsTUFBTSxVQUFVLEdBQUc7WUFDakIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNO1lBQ3hCLE1BQU0sQ0FBQyxVQUFVLENBQUMsTUFBTTtZQUN4QixNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU07U0FDekIsQ0FBQTtRQUNELElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUNqQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUE7SUFDbkIsQ0FBQztJQUVPLDBCQUEwQixDQUFDLEVBQ2pDLFNBQVMsRUFDVCxFQUFFLEVBQ0YsS0FBSyxFQUtOO1FBQ0MsTUFBTSxHQUFHLEdBQUcsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUE7UUFDbEQsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUNuRCxNQUFNLFFBQVEsR0FBRyxJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztZQUMzQyxTQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQztZQUMvQixLQUFLLEVBQUUsQ0FBQztZQUNSLGdFQUFnRTtT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