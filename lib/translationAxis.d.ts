import BaseAxis, { AxisOptions } from './baseAxis';
export default class TranslationAxis extends BaseAxis {
    constructor({ scene, boundingSphere }: AxisOptions);
    private createAxisGeometryInstance;
    private createAxisPrimitives;
    private createAxis;
}
