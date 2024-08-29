import * as Cesium from 'cesium';
import BaseAxis from './baseAxis';
export default class ScaleAxis extends BaseAxis {
    constructor({ scene, boundingSphere }) {
        super({ scene, boundingSphere });
        this.createAxis();
    }
    createAxisGeometryInstance({ id, color, endPoint }) {
        const polyline = new Cesium.PolylineGeometry({
            positions: [this.center, endPoint],
            width: 5
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
            modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(endPoint),
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
                color: axisColor[index],
                endPoint: this.endPoints[index]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NhbGVBeGlzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3NjYWxlQXhpcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxNQUFNLFFBQVEsQ0FBQTtBQUNoQyxPQUFPLFFBQVEsTUFBTSxZQUFZLENBQUE7QUFHakMsTUFBTSxDQUFDLE9BQU8sT0FBTyxTQUFVLFNBQVEsUUFBUTtJQUM3QyxZQUFZLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBZTtRQUNoRCxLQUFLLENBQUMsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQTtRQUNoQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUE7SUFDbkIsQ0FBQztJQUVPLDBCQUEwQixDQUFDLEVBQ2pDLEVBQUUsRUFDRixLQUFLLEVBQ0wsUUFBUSxFQU1UO1FBQ0MsTUFBTSxRQUFRLEdBQUcsSUFBSSxNQUFNLENBQUMsZ0JBQWdCLENBQUM7WUFDM0MsU0FBUyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUM7WUFDbEMsS0FBSyxFQUFFLENBQUM7U0FDVCxDQUFDLENBQUE7UUFDRixNQUFNLHdCQUF3QixHQUFHLElBQUksTUFBTSxDQUFDLGdCQUFnQixDQUFDO1lBQzNELFFBQVEsRUFBRSxRQUFRO1lBQ2xCLFVBQVUsRUFBRTtnQkFDVixLQUFLLEVBQUUsTUFBTSxDQUFDLDhCQUE4QixDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUM7YUFDOUQ7WUFDRCxFQUFFO1NBQ0gsQ0FBQyxDQUFBO1FBRUYsTUFBTSxHQUFHLEdBQUcsSUFBSSxNQUFNLENBQUMsV0FBVyxDQUFDO1lBQ2pDLE9BQU8sRUFBRSxJQUFJLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUM7WUFDN0MsT0FBTyxFQUFFLElBQUksTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdB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