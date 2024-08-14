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
                releaseGeometryInstances: false,
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
        const numPoints = Math.floor(this.radius * 100);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm90YXRpb25BeGlzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JvdGF0aW9uQXhpcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxNQUFNLFFBQVEsQ0FBQTtBQUVoQyxPQUFPLFFBQW1DLE1BQU0sWUFBWSxDQUFBO0FBRTVELE1BQU0sQ0FBQyxPQUFPLE9BQU8sWUFBYSxTQUFRLFFBQVE7SUFHaEQsWUFBWSxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsa0JBQWtCLEVBQWU7UUFDcEUsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxrQkFBa0IsRUFBRSxDQUFDLENBQUE7UUFIL0MsdUJBQWtCLEdBQXFCLEVBQUUsQ0FBQTtRQUk5QyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQTtJQUMzQixDQUFDO0lBRU8sa0JBQWtCO1FBQ3hCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFBO1FBQ2hELE1BQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDbkQsT0FBTyxJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUM7Z0JBQzFCLGlCQUFpQixFQUFFLENBQUMsUUFBUSxDQUFDO2dCQUM3QixVQUFVLEVBQUUsSUFBSSxNQUFNLENBQUMsMEJBQTBCLENBQUM7b0JBQ2hELFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUU7d0JBQzFDLEtBQUssRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQztxQkFDN0IsQ0FBQztpQkFDSCxDQUFDO2dCQUNGLG1CQUFtQixFQUFFLElBQUksTUFBTSxDQUFDLDBCQUEwQixDQUFDO29CQUN6RCxRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFO3dCQUMxQyxLQUFLLEVBQUUsSUFB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