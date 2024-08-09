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
