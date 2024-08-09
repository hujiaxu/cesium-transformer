import * as Cesium from 'cesium';
import { ModeCollection } from './type';
interface Options {
    scene: Cesium.Scene;
    element: Cesium.Primitive;
    boundingSphere: Cesium.BoundingSphere;
}
export default class Transformer {
    scene: Cesium.Scene;
    element: Cesium.Primitive;
    private boundingSphere;
    private cachedCenter;
    private center;
    private handler;
    private activeAxis;
    private activeAxisType;
    private gizmo;
    private mode;
    private gizmoModesBillboard;
    private intersectStartPoint;
    private intersectEndPoint;
    private pointPrimitiveCollection;
    private plane;
    private onMouseDown;
    private onMouseUp;
    private onMouseMove;
    constructor({ scene, element, boundingSphere }: Options);
    get isDetoryed(): boolean;
    private init;
    initGizmo(): void;
    changeMode(mode: ModeCollection): void;
    private createPlane;
    private updatePlane;
    private getActiveAxisFromMouse;
    private updateBoundingSphere;
    private updateTranslation;
    private rotateAroundCenter;
    private updateRotation;
    private getPointToCenterRay;
    private mouseDown;
    private mouseUp;
    private mouseMove;
    private registerHandler;
    destory(): void;
    private detoryHandler;
}
export {};
