import * as Cesium from 'cesium';
import BaseAxis from './baseAxis';
import TorusGeometry from './torusGeometry';
export default class RotationAxis extends BaseAxis {
    constructor({ scene, boundingSphere }) {
        super({ scene, boundingSphere });
        this.createRotationAxis();
    }
    createRotationAxis() {
        const torusGeometryAttributes = new TorusGeometry({
            radius: this.radius,
            tube: 0.1,
            radialSegments: 32,
            tubularSegments: 10,
            arc: 2 * Math.PI,
            center: this.center
        });
        const { geometry } = torusGeometryAttributes;
        const primitive = new Cesium.Primitive({
            geometryInstances: new Cesium.GeometryInstance({
                geometry: geometry,
                id: 'rotation-axis',
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.BLUE.withAlpha(0.3))
                }
            }),
            appearance: new Cesium.PerInstanceColorAppearance({
                closed: true,
                translucent: false
            }),
            releaseGeometryInstances: false,
            asynchronous: false
        });
        this.scene.primitives.add(primitive);
        console.log('primitive: ', primitive);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm90YXRpb25BeGlzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JvdGF0aW9uQXhpcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxNQUFNLFFBQVEsQ0FBQTtBQUVoQyxPQUFPLFFBQXlCLE1BQU0sWUFBWSxDQUFBO0FBQ2xELE9BQU8sYUFBYSxNQUFNLGlCQUFpQixDQUFBO0FBRTNDLE1BQU0sQ0FBQyxPQUFPLE9BQU8sWUFBYSxTQUFRLFFBQVE7SUFDaEQsWUFBWSxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQWU7UUFDaEQsS0FBSyxDQUFDLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUE7UUFDaEMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUE7SUFDM0IsQ0FBQztJQUVPLGtCQUFrQjtRQUN4QixNQUFNLHVCQUF1QixHQUFrQixJQUFJLGFBQWEsQ0FBQztZQUMvRCxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07WUFDbkIsSUFBSSxFQUFFLEdBQUc7WUFDVCxjQUFjLEVBQUUsRUFBRTtZQUNsQixlQUFlLEVBQUUsRUFBRTtZQUNuQixHQUFHLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFO1lBQ2hCLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtTQUNwQixDQUFDLENBQUE7UUFDRixNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsdUJBQXVCLENBQUE7UUFFNUMsTUFBTSxTQUFTLEdBQUcsSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDO1lBQ3JDLGlCQUFpQixFQUFFLElBQUksTUFBTSxDQUFDLGdCQUFnQixDQUFDO2dCQUM3QyxRQUFRLEVBQUUsUUFBUztnQkFDbkIsRUFBRSxFQUFFLGVBQWU7Z0JBQ25CLFVBQVUsRUFBRTtvQkFDVixLQUFLLEVBQUUsTUFBTSxDQUFDLDhCQUE4QixDQUFDLFNBQVMsQ0FDcEQsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUNqQztpQkFDRjthQUNGLENBQUM7WUFDRixVQUFVLEVBQUUsSUFBSSxNQUFNLENBQUMsMEJBQTBCLENBQUM7Z0JBQ2hELE1BQU0sRUFBRSxJQUFJO2dCQUNaLFdBQVcsRUFBRSxLQUFLO2FBQ25CLENBQUM7WUFDRix3QkFBd0IsRUFBRSxLQUFLO1lBQy9CLFlBQVksRUFBRSxLQUFLO1NBQ3BCLENBQUMsQ0FBQTtRQUNGLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQTtRQUNwQyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxTQUFTLENBQUMsQ0FBQTtJQUN2QyxDQUFDO0NBQ0YifQ==