import * as Cesium from 'cesium';
interface Options {
    scene: Cesium.Scene;
    element: Cesium.Primitive;
    boundingSphere: Cesium.BoundingSphere;
}
export default class Transformer {
    scene: Cesium.Scene;
    element: Cesium.Primitive;
    boundingSphere: Cesium.BoundingSphere;
    private center;
    private handler;
    private activeAxis;
    private activeAxisType;
    private translationAxis;
    private onMouseDown;
    private onMouseUp;
    private onMouseMove;
    constructor({ scene, element, boundingSphere }: Options);
    get isDetoryed(): boolean;
    init(): void;
    private createPlane;
    private getActiveAxisFromMouse;
    private updateTranslation;
    private mouseDown;
    private mouseUp;
    private mouseMove;
    private registerHandler;
    destory(): void;
    private detoryHandler;
}
export {};
