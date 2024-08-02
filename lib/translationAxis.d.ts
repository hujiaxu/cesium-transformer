import * as Cesium from 'cesium';
interface AxisOptions {
    scene: Cesium.Scene;
    center: Cesium.Cartesian3;
}
export declare enum AxisType {
    X = 0,
    Y = 1,
    Z = 2
}
export default class TranslationAxis {
    static get DEFAULT(): Cesium.Matrix4;
    private center;
    private scene;
    translationAxis: Cesium.Primitive | undefined;
    directions: Cesium.Cartesian3[];
    axises: Cesium.Primitive[];
    constructor({ scene, center }: AxisOptions);
    private createAxisGeometryInstance;
    private createAxisPrimitives;
    private createAxis;
}
export {};
