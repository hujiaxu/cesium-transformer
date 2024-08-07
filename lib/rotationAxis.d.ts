import BaseAxis, { AxisOptions } from './baseAxis';
export default class RotationAxis extends BaseAxis {
    constructor({ scene, boundingSphere }: AxisOptions);
    private createRotationAxis;
    private createGeometryInstances;
}
