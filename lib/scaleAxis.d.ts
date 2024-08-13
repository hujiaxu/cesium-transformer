import BaseAxis, { AxisOptions } from './baseAxis';
export default class ScaleAxis extends BaseAxis {
    constructor({ scene, boundingSphere }: AxisOptions);
    private createAxisGeometryInstance;
    private createAxisPrimitives;
    private createAxis;
}
