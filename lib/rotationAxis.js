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
        this.axises = this.scene.primitives.add(primitive);
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
            // const rotationQuaternion = Cesium.Quaternion.fromAxisAngle(
            //   Cesium.Cartesian3.UNIT_Z,
            //   Cesium.Math.PI_OVER_TWO
            // )
            // const hpr = Cesium.HeadingPitchRoll.fromQuaternion(rotationQuaternion)
            // console.log('hpr: ', hpr)
            // const hpr = new Cesium.HeadingPitchRoll(0, 0, 0)
            // const modelMatrix = Cesium.Matrix4.multiplyByMatrix3(
            //   Cesium.Matrix4.IDENTITY,
            //   Cesium.Matrix3.fromQuaternion(rotationQuaternion),
            //   new Cesium.Matrix4()
            // )
            const modelMatrix = Cesium.Matrix4.IDENTITY;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm90YXRpb25BeGlzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JvdGF0aW9uQXhpcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxNQUFNLFFBQVEsQ0FBQTtBQUVoQyxPQUFPLFFBQW1DLE1BQU0sWUFBWSxDQUFBO0FBQzVELE9BQU8sYUFBYSxNQUFNLGlCQUFpQixDQUFBO0FBRTNDLE1BQU0sQ0FBQyxPQUFPLE9BQU8sWUFBYSxTQUFRLFFBQVE7SUFDaEQsWUFBWSxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQWU7UUFDaEQsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUE7UUFDaEMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUE7SUFDM0IsQ0FBQztJQUVPLGtCQUFrQjtRQUN4QixNQUFNLFNBQVMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUM7WUFDckMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLHVCQUF1QixFQUFFO1lBQ2pELFVBQVUsRUFBRSxJQUFJLE1BQU0sQ0FBQywwQkFBMEIsQ0FBQztnQkFDaEQsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsV0FBVyxFQUFFLEtBQUs7Z0JBQ2xCLFdBQVcsRUFBRTtvQkFDWCxTQUFTLEVBQUU7d0JBQ1QsT0FBTyxFQUFFLEtBQUs7d0JBQ2QsMkNBQTJDO3FCQUM1QztpQkFDRjthQUNGLENBQUM7WUFDRix3QkFBd0IsRUFBRSxLQUFLO1lBQy9CLFlBQVksRUFBRSxLQUFLO1NBQ3BCLENBQUMsQ0FBQTtRQUNGLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFBO0lBQ3BELENBQUM7SUFFTyx1QkFBdUI7UUFDN0IsTUFBTSx1QkFBdUIsR0FBa0IsSUFBSSxhQUFhLENBQUM7WUFDL0QsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO1lBQ25CLElBQUksRUFBRSxJQUFJO1lBQ1YsY0FBYyxFQUFFLEVBQUU7WUFDbEIsZUFBZSxFQUFFLEdBQUc7WUFDcEIsR0FBRyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRTtZQUNoQixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07U0FDcEIsQ0FBQyxDQUFBO1FBQ0YsTUFBTSxFQUFFLFFBQVEsRUFBRSxHQUFHLHVCQUF1QixDQUFBO1FBRTVDLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFZLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDaEUsOERBQThEO1lBQzlELDhCQUE4QjtZQUM5Qiw0QkFBNEI7WUFDNUIsSUFBSTtZQUNKLHlFQUF5RTtZQUN6RSw0QkFBNEI7WUFDNUIsbURBQW1EO1lBQ25ELHdEQUF3RDtZQUN4RCw2QkFBNkI7WUFDN0IsdURBQXVEO1lBQ3ZELHlCQUF5QjtZQUN6QixJQUFJO1lBQ0osTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUE7WUFDM0MsT0FBTyxJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztnQkFDakMsUUFBUSxFQUFFLFFBQVM7Z0JBQ25CLEVBQUUsRUFBRSxFQUFFLENBQUMsUUFBUSxFQUFFO2dCQUNqQixVQUFVLEVBQUU7b0JBQ1YsS0FBSyxFQUFFLE1BQU0sQ0FBQyw4QkFBOEIsQ0FBQyxTQUFTLENBQ3BELElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQ3RCO2lCQUNGO2dCQUNELFdBQVc7YUFDWixDQUFDLENBQUE7UUFDSixDQUFDLENBQUMsQ0FBQTtRQUVGLE9BQU8saUJBQWlCLENBQUE7SUFDMUIsQ0FBQztDQUNGIn0=