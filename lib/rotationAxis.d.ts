import BaseAxis, { AxisOptions } from './baseAxis';
export default class RotationAxis extends BaseAxis {
    constructor({ scene, boundingSphere, elementModelMatrix }: AxisOptions);
    private createRotationAxis;
    private createGeometryInstances;
}
