import * as Cesium from 'cesium';
import BaseAxis from './baseAxis';
import { AxisOptions } from './type';
export default class RotationAxis extends BaseAxis {
    cachedModelMatrixs: Cesium.Matrix4[];
    constructor({ scene, boundingSphere, elementModelMatrix }: AxisOptions);
    private createRotationAxis;
    private createTorusGeometry;
    private createGeometryInstances;
}
