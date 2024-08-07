import * as Cesium from 'cesium';
import BaseAxis from './baseAxis';
import TorusGeometry from './torusGeometry';
export default class RotationAxis extends BaseAxis {
    constructor({ scene, boundingSphere }) {
        super({ scene, boundingSphere });
        this.createRotationAxis();
    }
    createRotationAxis() {
        const primitive = new Cesium.Primitive({
            geometryInstances: this.createGeometryInstances(),
            appearance: new Cesium.PerInstanceColorAppearance({
                flat: true,
                translucent: false,
                renderState: {
                    depthTest: {
                        enabled: false
                        // func: Cesium.DepthFunction.LESS_OR_EQUAL
                    }
                }
            }),
            releaseGeometryInstances: false,
            asynchronous: false
        });
        this.scene.primitives.add(primitive);
        this.axises = [primitive];
    }
    createGeometryInstances() {
        const torusGeometryAttributes = new TorusGeometry({
            radius: this.radius,
            tube: 0.05,
            radialSegments: 32,
            tubularSegments: 100,
            arc: 2 * Math.PI,
            center: this.center
        });
        const { geometry } = torusGeometryAttributes;
        const geometryInstances = this.axisId.map((id, index) => {
            const rotationQuaternion = Cesium.Quaternion.fromAxisAngle(this.directions[Math.abs(index - 2)], Cesium.Math.toRadians(270));
            const translationToCenter = Cesium.Matrix4.fromTranslation(this.center);
            const rotationMatrix = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromQuaternion(rotationQuaternion));
            const translationBack = Cesium.Matrix4.fromTranslation(Cesium.Cartesian3.negate(this.center, new Cesium.Cartesian3()));
            const modelMatrix = Cesium.Matrix4.IDENTITY.clone();
            Cesium.Matrix4.multiply(modelMatrix, translationToCenter, modelMatrix);
            Cesium.Matrix4.multiply(modelMatrix, rotationMatrix, modelMatrix);
            Cesium.Matrix4.multiply(modelMatrix, translationBack, modelMatrix);
            return new Cesium.GeometryInstance({
                geometry: geometry,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm90YXRpb25BeGlzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JvdGF0aW9uQXhpcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxNQUFNLFFBQVEsQ0FBQTtBQUVoQyxPQUFPLFFBQW1DLE1BQU0sWUFBWSxDQUFBO0FBQzVELE9BQU8sYUFBYSxNQUFNLGlCQUFpQixDQUFBO0FBRTNDLE1BQU0sQ0FBQyxPQUFPLE9BQU8sWUFBYSxTQUFRLFFBQVE7SUFDaEQsWUFBWSxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQWU7UUFDaEQsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUE7UUFDaEMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUE7SUFDM0IsQ0FBQztJQUVPLGtCQUFrQjtRQUN4QixNQUFNLFNBQVMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUM7WUFDckMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLHVCQUF1QixFQUFFO1lBQ2pELFVBQVUsRUFBRSxJQUFJLE1BQU0sQ0FBQywwQkFBMEIsQ0FBQztnQkFDaEQsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsV0FBVyxFQUFFLEtBQUs7Z0JBQ2xCLFdBQVcsRUFBRTtvQkFDWCxTQUFTLEVBQUU7d0JBQ1QsT0FBTyxFQUFFLEtBQUs7d0JBQ2QsMkNBQTJDO3FCQUM1QztpQkFDRjthQUNGLENBQUM7WUFDRix3QkFBd0IsRUFBRSxLQUFLO1lBQy9CLFlBQVksRUFBRSxLQUFLO1NBQ3BCLENBQUMsQ0FBQTtRQUNGLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQTtRQUNwQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUE7SUFDM0IsQ0FBQztJQUVPLHVCQUF1QjtRQUM3QixNQUFNLHVCQUF1QixHQUFrQixJQUFJLGFBQWEsQ0FBQztZQUMvRCxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07WUFDbkIsSUFBSSxFQUFFLElBQUk7WUFDVixjQUFjLEVBQUUsRUFBRTtZQUNsQixlQUFlLEVBQUUsR0FBRztZQUNwQixHQUFHLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFO1lBQ2hCLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtTQUNwQixDQUFDLENBQUE7UUFDRixNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsdUJBQXVCLENBQUE7UUFFNUMsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQVksRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUNoRSxNQUFNLGtCQUFrQixHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUN4RCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQ3BDLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUMzQixDQUFBO1lBRUQsTUFBTSxtQkFBbUIsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDdkUsTUFBTSxjQUFjLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsQ0FDM0QsTUFBTSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsa0JBQWtCLENBQUMsQ0FDbEQsQ0FBQTtZQUNELE1BQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUNwRCxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQy9ELENBQUE7WUFDRCxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtZQUVuRCxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsbUJBQW1CLEVBQUUsV0FBVyxDQUFDLENBQUE7WUFDdEUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLGNBQWMsRUFBRSxXQUFXLENBQUMsQ0FBQTtZQUNqRSxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsZUFBZSxFQUFFLFdBQVcsQ0FBQyxDQUFBO1lBQ2xFLE9BQU8sSUFBSSxNQUFNLENBQUMsZ0JBQWdCLENBQUM7Z0JBQ2pDLFFBQVEsRUFBRSxRQUFTO2dCQUNuQixFQUFFLEVBQUUsRUFBRSxDQUFDLFFBQVEsRUFBRTtnQkFDakIsVUFBVSxFQUFFO29CQUNWLEtBQUssRUFBRSxNQUFNLENBQUMsOEJBQThCLENBQUMsU0FBUyxDQUNwRCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUN0QjtpQkFDRjtnQkFDRCxXQUFXO2FBQ1osQ0FBQyxDQUFBO1FBQ0osQ0FBQyxDQUFDLENBQUE7UUFFRixPQUFPLGlCQUFpQixDQUFBO0lBQzFCLENBQUM7Q0FDRiJ9