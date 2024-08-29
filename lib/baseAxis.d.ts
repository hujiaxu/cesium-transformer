import * as Cesium from 'cesium';
import { AxisOptions, AxisType } from './type';
export default class BaseAxis {
    center: Cesium.Cartesian3;
    radius: number;
    scene: Cesium.Scene;
    axisId: AxisType[];
    axisColor: Cesium.Color[];
    directions: Cesium.Cartesian3[];
    relativeDirections: Cesium.Cartesian3[];
    directionsWithLength: Cesium.Cartesian3[];
    rays: Cesium.Ray[];
    endPoints: Cesium.Cartesian3[];
    axises: Cesium.Primitive[];
    boundingSphere: Cesium.BoundingSphere;
    cachedScaleMatrix: Cesium.Matrix4[];
    cachedRotationMatrix: Cesium.Matrix4;
    cachedTranslationMatrix: Cesium.Matrix4[];
    constructor({ scene, boundingSphere }: AxisOptions);
    updateDirections(directions: Cesium.Cartesian3[]): void;
    initCachedMatrix(): void;
    destory(): void;
}
