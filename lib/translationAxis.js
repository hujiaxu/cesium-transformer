import * as Cesium from 'cesium';
export var AxisType;
(function (AxisType) {
    AxisType[AxisType["X"] = 0] = "X";
    AxisType[AxisType["Y"] = 1] = "Y";
    AxisType[AxisType["Z"] = 2] = "Z";
})(AxisType || (AxisType = {}));
export default class TranslationAxis {
    static get DEFAULT() {
        return Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.ZERO);
    }
    constructor({ scene, center }) {
        this.directions = [
            Cesium.Cartesian3.UNIT_X,
            Cesium.Cartesian3.UNIT_Y,
            Cesium.Cartesian3.UNIT_Z
        ];
        this.axises = [];
        this.center = center;
        this.scene = scene;
        this.createAxis();
    }
    createAxisGeometryInstance({ direction, id, color }) {
        const ray = new Cesium.Ray(this.center, direction);
        const point = Cesium.Ray.getPoint(ray, 10);
        const polyline = new Cesium.PolylineGeometry({
            positions: [this.center, point],
            width: 10
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
        const axisId = [AxisType.X, AxisType.Y, AxisType.Z];
        const axisColor = [Cesium.Color.RED, Cesium.Color.GREEN, Cesium.Color.BLUE];
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
            return new Cesium.Primitive({
                geometryInstances: [geometryInstance],
                asynchronous: false,
                appearance: new Cesium.PolylineMaterialAppearance({
                    material: Cesium.Material.fromType('PolylineArrow', {
                        color: axisColor[index]
                    })
                }),
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
        this.translationAxis = this.scene.primitives.add(primitiveCollection);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNsYXRpb25BeGlzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3RyYW5zbGF0aW9uQXhpcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssTUFBTSxNQUFNLFFBQVEsQ0FBQTtBQU9oQyxNQUFNLENBQU4sSUFBWSxRQUlYO0FBSkQsV0FBWSxRQUFRO0lBQ2xCLGlDQUFLLENBQUE7SUFDTCxpQ0FBSyxDQUFBO0lBQ0wsaUNBQUssQ0FBQTtBQUNQLENBQUMsRUFKVyxRQUFRLEtBQVIsUUFBUSxRQUluQjtBQUVELE1BQU0sQ0FBQyxPQUFPLE9BQU8sZUFBZTtJQUMzQixNQUFNLEtBQUssT0FBTztRQUN2QixPQUFPLE1BQU0sQ0FBQyxVQUFVLENBQUMsdUJBQXVCLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUMxRSxDQUFDO0lBZUQsWUFBWSxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQWU7UUFQbkMsZUFBVSxHQUF3QjtZQUN2QyxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU07WUFDeEIsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNO1lBQ3hCLE1BQU0sQ0FBQyxVQUFVLENBQUMsTUFBTTtTQUN6QixDQUFBO1FBQ00sV0FBTSxHQUF1QixFQUFFLENBQUE7UUFHcEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7UUFFcEIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7UUFDbEIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFBO0lBQ25CLENBQUM7SUFFTywwQkFBMEIsQ0FBQyxFQUNqQyxTQUFTLEVBQ1QsRUFBRSxFQUNGLEtBQUssRUFLTjtRQUNDLE1BQU0sR0FBRyxHQUFHLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1FBQ2xELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFD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