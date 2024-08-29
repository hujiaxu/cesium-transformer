import * as Cesium from 'cesium';
export interface TorusGeometryOptions {
    radius: number;
    tube: number;
    radialSegments: number;
    tubularSegments: number;
    arc: number;
    center: Cesium.Cartesian3;
}
export declare enum ModeCollection {
    TRANSLATION = "translation",
    ROTATION = "rotation",
    SCALE = "scale"
}
export declare const MODES: ModeCollection[];
export type elementType = Cesium.Primitive | Cesium.Cesium3DTileset | Cesium.Model;
export interface TransformerConstructorOptions {
    scene: Cesium.Scene;
    element: elementType;
    boundingSphere: Cesium.BoundingSphere;
}
export interface PickObjectInterface {
    primitive: Cesium.Primitive;
    id: AxisType;
}
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
