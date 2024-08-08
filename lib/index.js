import * as Cesium from 'cesium';
import TranslationAxis from './translationAxis';
import RotationAxis from './rotationAxis';
import { AxisType } from './baseAxis';
import { ModeCollection } from './type';
import translationImage from '../assets/translation.png';
import rotation from '../assets/rotation.png';
import scale from '../assets/scale.png';
export default class Transformer {
    constructor({ scene, element, boundingSphere }) {
        this.mode = ModeCollection.TRANSLATION;
        this.gizmoModesBillboard = new Cesium.BillboardCollection();
        if (!scene)
            throw new Error('scene is required');
        this.scene = scene;
        this.element = element;
        this.boundingSphere = boundingSphere;
        this.onMouseDown = this.mouseDown.bind(this);
        this.onMouseUp = this.mouseUp.bind(this);
        this.onMouseMove = this.mouseMove.bind(this);
        this.init();
    }
    get isDetoryed() {
        return this.handler === undefined;
    }
    init() {
        if (!this.element || !this.boundingSphere)
            throw new Error('element and boundingSphere are required');
        const pointPrimitiveCollection = new Cesium.PointPrimitiveCollection();
        this.scene.primitives.add(pointPrimitiveCollection);
        this.pointPrimitiveCollection = pointPrimitiveCollection;
        this.center = this.boundingSphere.center.clone();
        this.changeMode(ModeCollection.ROTATION);
        // this.initGizmo()
        this.registerHandler();
    }
    initGizmo() {
        this.scene.primitives.add(this.gizmoModesBillboard);
        this.gizmoModesBillboard.add({
            position: this.center,
            image: rotation,
            horizontalOrigin: Cesium.HorizontalOrigin.RIGHT,
            verticalOrigin: Cesium.VerticalOrigin.TOP
        });
        this.gizmoModesBillboard.add({
            position: this.center,
            image: scale,
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM
        });
        this.gizmoModesBillboard.add({
            position: this.center,
            image: translationImage,
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            verticalOrigin: Cesium.VerticalOrigin.TOP
        });
    }
    changeMode(mode) {
        var _a;
        this.mode = mode;
        (_a = this.gizmo) === null || _a === void 0 ? void 0 : _a.destory();
        if (mode === ModeCollection.TRANSLATION) {
            this.gizmo = new TranslationAxis({
                scene: this.scene,
                boundingSphere: this.boundingSphere
            });
        }
        if (mode === ModeCollection.ROTATION) {
            this.gizmo = new RotationAxis({
                scene: this.scene,
                boundingSphere: this.boundingSphere
            });
        }
    }
    createPlane() {
        if (!this.center)
            return;
        if (!this.gizmo)
            return;
        if (this.mode === ModeCollection.ROTATION) {
            const direction = this.gizmo.directions[this.activeAxisType].clone();
            return Cesium.Plane.fromPointNormal(this.center, Cesium.Cartesian3.normalize(direction, new Cesium.Cartesian3()));
        }
        const normalCameraDirection = Cesium.Cartesian3.normalize(this.scene.camera.direction, new Cesium.Cartesian3());
        const plane = Cesium.Plane.fromPointNormal(this.center, normalCameraDirection);
        return plane;
    }
    updatePlane() {
        if (!this.center)
            return;
        if (!this.gizmo)
            return;
        const direction = this.gizmo.directions[this.activeAxisType].clone();
        Cesium.Matrix4.multiplyByPoint(this.gizmo.axises[0].modelMatrix, direction, direction);
        this.plane = Cesium.Plane.fromPointNormal(this.center, Cesium.Cartesian3.normalize(direction, new Cesium.Cartesian3()));
    }
    getActiveAxisFromMouse(pickObjects) {
        if (!pickObjects || pickObjects.length === 0)
            return undefined;
        const axisArray = [AxisType.X, AxisType.Y, AxisType.Z];
        for (const axis of pickObjects) {
            if ((axis === null || axis === void 0 ? void 0 : axis.primitive) instanceof Cesium.Primitive &&
                axisArray.includes(Number(axis.id))) {
                return {
                    activeAxis: axis.primitive,
                    activeAxisType: Number(axis.id)
                };
            }
        }
    }
    updateTranslation(newMatrix) {
        Cesium.Matrix4.multiply(this.element.modelMatrix, newMatrix, this.element.modelMatrix);
        // this.gizmo?.axises.forEach((axis) => {
        //   Cesium.Matrix4.multiply(axis.modelMatrix, newMatrix, axis.modelMatrix)
        // })
    }
    mouseDown({ position }) {
        const objects = this.scene.pick(position);
        const activeAxis = this.getActiveAxisFromMouse([objects]);
        if (activeAxis) {
            this.activeAxis = activeAxis.activeAxis;
            this.activeAxisType = activeAxis.activeAxisType;
            this.updatePlane();
        }
    }
    mouseUp() {
        const scene = this.scene;
        this.activeAxis = undefined;
        scene.screenSpaceCameraController.enableRotate = true;
        scene.screenSpaceCameraController.enableTranslate = true;
        this.pointPrimitiveCollection.removeAll();
        this.intersectStartPoint = undefined;
        this.intersectEndPoint = undefined;
    }
    mouseMove({ startPosition, endPosition }) {
        const scene = this.scene;
        const objects = scene.pick(endPosition);
        const currentPointAxis = this.getActiveAxisFromMouse([objects]);
        if (currentPointAxis || this.activeAxis) {
            document.body.style.cursor = 'move';
        }
        else {
            document.body.style.cursor = 'default';
        }
        if (!Cesium.defined(this.activeAxis))
            return;
        if (!Cesium.defined(this.plane)) {
            this.plane = this.createPlane();
        }
        const plane = this.plane;
        if (!plane)
            return;
        this.plane = plane;
        const startRay = scene.camera.getPickRay(startPosition);
        const endRay = scene.camera.getPickRay(endPosition);
        if (!startRay || !endRay)
            return;
        const startIntersection = Cesium.IntersectionTests.rayPlane(startRay, plane, new Cesium.Cartesian3());
        const endIntersection = Cesium.IntersectionTests.rayPlane(endRay, plane, new Cesium.Cartesian3());
        if (!Cesium.defined(startIntersection) || !Cesium.defined(endIntersection))
            return;
        const direction = this.gizmo.directions[this.activeAxisType];
        const modelMatrix = Cesium.Matrix4.IDENTITY.clone();
        if (this.mode === ModeCollection.TRANSLATION) {
            const offset = Cesium.Cartesian3.subtract(endIntersection, startIntersection, new Cesium.Cartesian3());
            const distanceByDirection = Cesium.Cartesian3.dot(offset, direction.clone());
            Cesium.Cartesian3.multiplyByScalar(direction, distanceByDirection, offset);
            const translation = Cesium.Matrix4.fromTranslation(offset);
            Cesium.Matrix4.multiply(modelMatrix, translation, modelMatrix);
            this.updateTranslation(modelMatrix);
        }
        if (this.mode === ModeCollection.ROTATION) {
            const centerToStartIntersection = Cesium.Cartesian3.subtract(startIntersection, this.center, new Cesium.Cartesian3());
            const centerToEndIntersection = Cesium.Cartesian3.subtract(endIntersection, this.center, new Cesium.Cartesian3());
            const centerToStartIntersectionRay = new Cesium.Ray(this.center, Cesium.Cartesian3.normalize(centerToStartIntersection, new Cesium.Cartesian3()));
            const centerToEndIntersectionRay = new Cesium.Ray(this.center, Cesium.Cartesian3.normalize(centerToEndIntersection, new Cesium.Cartesian3()));
            const cross = Cesium.Cartesian3.cross(centerToStartIntersection, centerToEndIntersection, new Cesium.Cartesian3());
            const number = Cesium.Cartesian3.dot(cross, direction);
            const signal = number / (number ? Math.abs(number) : 1);
            const startPoint = Cesium.Ray.getPoint(centerToStartIntersectionRay, this.gizmo.radius);
            const endPoint = Cesium.Ray.getPoint(centerToEndIntersectionRay, this.gizmo.radius);
            const angle = Cesium.Cartesian3.angleBetween(centerToStartIntersection || startPoint, centerToEndIntersection || endPoint);
            if (!this.intersectStartPoint) {
                this.intersectStartPoint = this.pointPrimitiveCollection.add({
                    color: Cesium.Color.YELLOW,
                    position: startPoint,
                    pixelSize: 10
                });
            }
            if (!this.intersectEndPoint) {
                this.intersectEndPoint = this.pointPrimitiveCollection.add({
                    color: Cesium.Color.YELLOW,
                    position: endPoint,
                    pixelSize: 10
                });
            }
            else {
                this.intersectEndPoint.position = endPoint;
            }
            const translationToCenter = Cesium.Matrix4.fromTranslation(this.center.clone());
            const rotation = Cesium.Quaternion.fromAxisAngle(direction, angle * signal);
            const rotationMatrix = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromQuaternion(rotation));
            const translationBack = Cesium.Matrix4.fromTranslation(Cesium.Cartesian3.negate(this.center, new Cesium.Cartesian3()));
            Cesium.Matrix4.multiply(modelMatrix, translationToCenter, modelMatrix);
            Cesium.Matrix4.multiply(modelMatrix, rotationMatrix, modelMatrix);
            Cesium.Matrix4.multiply(modelMatrix, translationBack, modelMatrix);
        }
        this.updateTranslation(modelMatrix);
        scene.screenSpaceCameraController.enableRotate = false;
        scene.screenSpaceCameraController.enableTranslate = false;
    }
    registerHandler() {
        const handler = new Cesium.ScreenSpaceEventHandler(this.scene.canvas);
        handler.setInputAction(this.onMouseDown, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        handler.setInputAction(this.onMouseUp, Cesium.ScreenSpaceEventType.LEFT_UP);
        handler.setInputAction(this.onMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.handler = handler;
    }
    destory() {
        this.detoryHandler();
    }
    detoryHandler() {
        if (this.handler) {
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
            this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            this.handler.destroy();
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLE1BQU0sTUFBTSxRQUFRLENBQUE7QUFDaEMsT0FBTyxlQUFlLE1BQU0sbUJBQW1CLENBQUE7QUFDL0MsT0FBTyxZQUFZLE1BQU0sZ0JBQWdCLENBQUE7QUFDekMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLFlBQVksQ0FBQTtBQUNyQyxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sUUFBUSxDQUFBO0FBQ3ZDLE9BQU8sZ0JBQWdCLE1BQU0sMkJBQTJCLENBQUE7QUFDeEQsT0FBTyxRQUFRLE1BQU0sd0JBQXdCLENBQUE7QUFDN0MsT0FBTyxLQUFLLE1BQU0scUJBQXFCLENBQUE7QUFnQnZDLE1BQU0sQ0FBQyxPQUFPLE9BQU8sV0FBVztJQXlDOUIsWUFBWSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsY0FBYyxFQUFXO1FBNUIvQyxTQUFJLEdBQW1CLGNBQWMsQ0FBQyxXQUFXLENBQUE7UUFDakQsd0JBQW1CLEdBQ3pCLElBQUksTUFBTSxDQUFDLG1CQUFtQixFQUFFLENBQUE7UUEyQmhDLElBQUksQ0FBQyxLQUFLO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxDQUFBO1FBRWhELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFBO1FBRWxCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO1FBQ3RCLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFBO1FBRXBDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDNUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUN4QyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FB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