import BaseAxis from './baseAxis';
import { AxisOptions } from './type';
export default class ScaleAxis extends BaseAxis {
    constructor({ scene, boundingSphere }: AxisOptions);
    private createAxisGeometryInstance;
    private createAxisPrimitives;
    private createAxis;
}
