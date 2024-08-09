import * as Cesium from 'cesium';
export var AxisType;
(function (AxisType) {
    AxisType[AxisType["X"] = 0] = "X";
    AxisType[AxisType["Y"] = 1] = "Y";
    AxisType[AxisType["Z"] = 2] = "Z";
})(AxisType || (AxisType = {}));
export default class BaseAxis {
    constructor({ scene, boundingSphere, elementModelMatrix }) {
        this.axisId = [AxisType.X, AxisType.Y, AxisType.Z];
        this.axisColor = [Cesium.Color.RED, Cesium.Color.GREEN, Cesium.Color.BLUE];
        this.directions = [
            Cesium.Cartesian3.UNIT_X,
            Cesium.Cartesian3.UNIT_Y,
            Cesium.Cartesian3.UNIT_Z
        ];
        this.axises = [];
        this.center = boundingSphere.center;
        this.radius = boundingSphere.radius;
        this.boundingSphere = boundingSphere;
        this.scene = scene;
        const matrix = Cesium.Transforms.eastNorthUpToFixedFrame(this.center);
        const directions = this.axisId.map((_, index) => {
            const direction4 = Cesium.Matrix4.getColumn(matrix, index, new Cesium.Cartesian4());
            return Cesium.Cartesian3.fromCartesian4(direction4, new Cesium.Cartesian3());
            // return Cesium.Cartesian3.normalize(direction3, new Cesium.Cartesian3())
        });
        if (elementModelMatrix) {
            // Cesium.Matrix4.multiply(matrix, elementModelMatrix, matrix)
            directions.forEach((direction) => {
                Cesium.Matrix4.multiplyByPointAsVector(elementModelMatrix, direction, direction);
            });
        }
        this.directions = directions;
        console.log('directions: ', directions);
    }
    destory() {
        this.axises.forEach((axis) => {
            this.scene.primitives.remove(axis);
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZUF4aXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvYmFzZUF4aXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLE1BQU0sTUFBTSxRQUFRLENBQUE7QUFRaEMsTUFBTSxDQUFOLElBQVksUUFJWDtBQUpELFdBQVksUUFBUTtJQUNsQixpQ0FBSyxDQUFBO0lBQ0wsaUNBQUssQ0FBQTtJQUNMLGlDQUFLLENBQUE7QUFDUCxDQUFDLEVBSlcsUUFBUSxLQUFSLFFBQVEsUUFJbkI7QUFFRCxNQUFNLENBQUMsT0FBTyxPQUFPLFFBQVE7SUFvQjNCLFlBQVksRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixFQUFlO1FBYi9ELFdBQU0sR0FBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFekQsY0FBUyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUVyRSxlQUFVLEdBQXdCO1lBQ3ZDLE1BQU0sQ0FBQyxVQUFVLENBQUMsTUFBTTtZQUN4QixNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU07WUFDeEIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNO1NBQ3pCLENBQUE7UUFDTSxXQUFNLEdBQXVCLEVBQUUsQ0FBQTtRQUtwQyxJQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUE7UUFDbkMsSUFBSSxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUMsTUFBTSxDQUFBO1FBQ25DLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFBO1FBRXBDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFBO1FBQ2xCLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBRXJFLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQzlDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUN6QyxNQUFNLEVBQ04sS0FBSyxFQUNMLElBQUksTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUN4QixDQUFBO1lBQ0QsT0FBTyxNQUFNLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FDckMsVUFBVSxFQUNWLElBQUksTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUN4QixDQUFBO1lBQ0QsMEVBQTBFO1FBQzVFLENBQUMsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxrQkFBa0IsRUFBRSxDQUFDO1lBQ3ZCLDhEQUE4RDtZQUM5RCxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsU0FBUyxFQUFFLEVBQUU7Z0JBQy9CLE1BQU0sQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQ3BDLGtCQUFrQixFQUNsQixTQUFTLEVBQ1QsU0FBUyxDQUNWLENBQUE7WUFDSCxDQUFDLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFDRCxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQTtRQUM1QixPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxVQUFVLENBQUMsQ0FBQTtJQUN6QyxDQUFDO0lBRU0sT0FBTztRQUNaLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDM0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3BDLENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQztDQUNGIn0=