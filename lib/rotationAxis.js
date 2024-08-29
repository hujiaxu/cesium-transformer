import * as Cesium from 'cesium';
import BaseAxis from './baseAxis';
export default class RotationAxis extends BaseAxis {
    constructor({ scene, boundingSphere, elementModelMatrix }) {
        super({ scene, boundingSphere, elementModelMatrix });
        this.cachedModelMatrixs = [];
        this.createRotationAxis();
    }
    createRotationAxis() {
        const instances = this.createGeometryInstances();
        const primitives = instances.map((instance, index) => {
            return new Cesium.Primitive({
                geometryInstances: [instance],
                appearance: new Cesium.PolylineMaterialAppearance({
                    material: Cesium.Material.fromType('Color', {
                        color: this.axisColor[index]
                    })
                }),
                depthFailAppearance: new Cesium.PolylineMaterialAppearance({
                    material: Cesium.Material.fromType('Color', {
                        color: this.axisColor[index].withAlpha(0.5)
                    })
                }),
                asynchronous: false,
                modelMatrix: Cesium.Matrix4.IDENTITY.clone()
            });
        });
        primitives.forEach((primitive) => {
            this.scene.primitives.add(primitive);
        });
        this.axises = primitives;
    }
    createTorusGeometry() {
        const center = this.center;
        const radius = this.radius;
        const numPoints = Math.floor(this.radius * 10);
        const positions = [];
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Cesium.Math.TWO_PI;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const point = Cesium.Cartesian3.fromElements(x, 0, y);
            const rotatedPoint = Cesium.Matrix4.multiplyByPoint(Cesium.Transforms.eastNorthUpToFixedFrame(center), point, new Cesium.Cartesian3());
            positions.push(rotatedPoint);
        }
        positions.push(positions[0]);
        const polylineGeometry = new Cesium.PolylineGeometry({
            positions: positions,
            width: 5.0
        });
        return polylineGeometry;
    }
    createGeometryInstances() {
        const geometryInstances = this.axisId.map((id, index) => {
            const rotationQuaternion = Cesium.Quaternion.fromAxisAngle(this.directions[Math.abs(index - 2)], Cesium.Math.toRadians(90));
            const translationToCenter = Cesium.Matrix4.fromTranslation(this.center);
            const rotationMatrix = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromQuaternion(rotationQuaternion));
            const translationBack = Cesium.Matrix4.fromTranslation(Cesium.Cartesian3.negate(this.center, new Cesium.Cartesian3()));
            const modelMatrix = Cesium.Matrix4.IDENTITY.clone();
            Cesium.Matrix4.multiply(modelMatrix, translationToCenter, modelMatrix);
            Cesium.Matrix4.multiply(modelMatrix, rotationMatrix, modelMatrix);
            Cesium.Matrix4.multiply(modelMatrix, translationBack, modelMatrix);
            this.cachedModelMatrixs[index] = modelMatrix;
            return new Cesium.GeometryInstance({
                geometry: this.createTorusGeometry(),
                id: id.toString(),
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(this.axisColor[index])
                },
                modelMatrix
            });
        });
        return geometryInstances;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm90YXRpb25BeGlzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JvdGF0aW9uQXhpcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxNQUFNLFFBQVEsQ0FBQTtBQUVoQyxPQUFPLFFBQVEsTUFBTSxZQUFZLENBQUE7QUFHakMsTUFBTSxDQUFDLE9BQU8sT0FBTyxZQUFhLFNBQVEsUUFBUTtJQUdoRCxZQUFZLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBZTtRQUNwRSxLQUFLLENBQUMsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixFQUFFLENBQUMsQ0FBQTtRQUgvQyx1QkFBa0IsR0FBcUIsRUFBRSxDQUFBO1FBSTlDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFBO0lBQzNCLENBQUM7SUFFTyxrQkFBa0I7UUFDeEIsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUE7UUFDaEQsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUNuRCxPQUFPLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQztnQkFDMUIsaUJBQWlCLEVBQUUsQ0FBQyxRQUFRLENBQUM7Z0JBQzdCLFVBQVUsRUFBRSxJQUFJLE1BQU0sQ0FBQywwQkFBMEIsQ0FBQztvQkFDaEQsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRTt3QkFDMUMsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO3FCQUM3QixDQUFDO2lCQUNILENBQUM7Z0JBQ0YsbUJBQW1CLEVBQUUsSUFBSSxNQUFNLENBQUMsMEJBQTBCLENBQUM7b0JBQ3pELFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUU7d0JBQzFDLEtBQUssRUFBRSxJQUFJ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