import * as Cesium from 'cesium';
import BaseAxis, { AxisOptions } from './baseAxis';
export default class RotationAxis extends BaseAxis {
    cachedModelMatrixs: Cesium.Matrix4[];
    constructor({ scene, boundingSphere, elementModelMatrix }: AxisOptions);
    private createRotationAxis;
    private createTorusGeometry;
    private createGeometryInstances;
}
