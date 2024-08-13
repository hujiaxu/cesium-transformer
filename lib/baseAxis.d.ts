import * as Cesium from 'cesium';
export interface AxisOptions {
    scene: Cesium.Scene;
    boundingSphere: Cesium.BoundingSphere;
    elementModelMatrix?: Cesium.Matrix4;
}
export declare enum AxisType {
    X = 0,
    Y = 1,
    Z = 2
}
export default class BaseAxis {
    center: Cesium.Cartesian3;
    endPoint: Cesium.Cartesian3;
    radius: number;
    scene: Cesium.Scene;
    axisId: AxisType[];
    axisColor: Cesium.Color[];
    directions: Cesium.Cartesian3[];
    axises: Cesium.Primitive[];
    boundingSphere: Cesium.BoundingSphere;
    constructor({ scene, boundingSphere, elementModelMatrix }: AxisOptions);
    destory(): void;
}
