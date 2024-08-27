import * as Cesium from 'cesium';
import TranslationAxis from './translationAxis';
import RotationAxis from './rotationAxis';
import { AxisType } from './baseAxis';
import { ModeCollection } from './type';
import translation from '../assets/translation.png';
import rotation from '../assets/rotation.png';
import scale from '../assets/scale.png';
import scale1 from '../assets/scale_1.png';
import ScaleAxis from './scaleAxis';
export default class Transformer {
    constructor({ scene, element, boundingSphere }) {
        this.elementCenterRelativeBoundingSphere = Cesium.Cartesian3.ZERO.clone();
        this.gizmoCachedRotationMatrix = Cesium.Matrix4.IDENTITY.clone();
        this.gizmoCachedScaleMatrix = Cesium.Matrix4.IDENTITY.clone();
        this.elementCachedRotationMatrix = Cesium.Matrix4.IDENTITY.clone();
        this.elementCachedScaleMatrix = Cesium.Matrix4.IDENTITY.clone();
        this.gizmoModesBillboard = new Cesium.BillboardCollection();
        if (!scene)
            throw new Error('scene is required');
        this.scene = scene;
        this.element = element;
        this.boundingSphere = boundingSphere.clone();
        this.onMouseDown = this.mouseDown.bind(this);
        this.onMouseUp = this.mouseUp.bind(this);
        this.onMouseMove = this.mouseMove.bind(this);
        const keyEvent = (e) => {
            if (e.key === 'w') {
                this.changeMode(ModeCollection.TRANSLATION);
            }
            if (e.key === 'e') {
                this.changeMode(ModeCollection.ROTATION);
            }
            if (e.key === 'r') {
                this.changeMode(ModeCollection.SCALE);
            }
        };
        this.keyEvent = keyEvent.bind(this);
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
        const elementTranslation = Cesium.Matrix4.getTranslation(this.element.modelMatrix, new Cesium.Cartesian3());
        this.elementCenterRelativeBoundingSphere = Cesium.Cartesian3.subtract(this.boundingSphere.center, elementTranslation, new Cesium.Cartesian3());
        this.center = this.boundingSphere.center;
        this.cachedCenter = this.center.clone();
        this.changeMode(ModeCollection.SCALE);
        document.addEventListener('keyup', this.keyEvent);
        // this.initGizmo()
        this.registerHandler();
    }
    initGizmo() {
        this.scene.primitives.add(this.gizmoModesBillboard);
        const billboardIds = ['translation', 'rotation', 'scale', 'scale1'];
        const images = [translation, rotation, scale, scale1];
        const horizontalOrigins = [
            Cesium.HorizontalOrigin.RIGHT,
            Cesium.HorizontalOrigin.LEFT,
            Cesium.HorizontalOrigin.RIGHT,
            Cesium.HorizontalOrigin.LEFT
        ];
        const verticalOrigins = [
            Cesium.VerticalOrigin.BOTTOM,
            Cesium.VerticalOrigin.BOTTOM,
            Cesium.VerticalOrigin.TOP,
            Cesium.VerticalOrigin.TOP
        ];
        billboardIds.forEach((id, index) => {
            this.gizmoModesBillboard.add({
                position: this.center,
                image: images[index],
                id,
                scale: 1 / 3,
                horizontalOrigin: horizontalOrigins[index],
                verticalOrigin: verticalOrigins[index],
                disableDepthTestDistance: Number.POSITIVE_INFINITY
            });
        });
    }
    changeMode(mode) {
        var _a;
        if (this.mode === mode)
            return;
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
        if (mode === ModeCollection.SCALE) {
            this.gizmo = new ScaleAxis({
                scene: this.scene,
                boundingSphere: this.boundingSphere
            });
        }
        this.applyLinearMatrixToGizmo();
    }
    applyLinearMatrixToGizmo() {
        if (!this.gizmo)
            return;
        if (Cesium.Matrix4.equals(this.element.modelMatrix, Cesium.Matrix4.IDENTITY))
            return;
        const rotation = Cesium.Matrix4.getRotation(this.element.modelMatrix, new Cesium.Matrix3());
        this.elementCachedRotationMatrix =
            Cesium.Matrix4.fromRotationTranslation(rotation);
        const elementScale = Cesium.Matrix4.getScale(this.element.modelMatrix, new Cesium.Cartesian3());
        const elementScaleMatrix = Cesium.Matrix4.fromScale(elementScale, new Cesium.Matrix4());
        this.elementCachedScaleMatrix = elementScaleMatrix;
        this.gizmoCachedRotationMatrix = Cesium.Matrix4.IDENTITY.clone();
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
        if (this.mode === ModeCollection.ROTATION) {
            const direction = this.gizmo.directions[this.activeAxisType].clone();
            const resultDirection = Cesium.Matrix4.multiplyByPointAsVector(this.gizmoCachedRotationMatrix, direction, new Cesium.Cartesian3());
            this.plane = Cesium.Plane.fromPointNormal(this.center, Cesium.Cartesian3.normalize(resultDirection, new Cesium.Cartesian3()));
        }
        else {
            this.plane = this.createPlane();
        }
    }
    getActiveAxisFromMouse(pickObjects) {
        if (!pickObjects || pickObjects.length === 0)
            return undefined;
        const axisArray = [AxisType.X, AxisType.Y, AxisType.Z];
        for (const axis of pickObjects) {
            if ((axis === null || axis === void 0 ? void 0 : axis.primitive) instanceof Cesium.Primitive &&
                axisArray.includes(Number(axis.id.toString().split('-')[0]))) {
                return {
                    activeAxis: axis.primitive,
                    activeAxisType: Number(axis.id.toString().split('-')[0])
                };
            }
        }
    }
    updateBoundingSphere(modelMatrix) {
        Cesium.Matrix4.multiplyByPoint(modelMatrix, this.center, this.center);
        this.boundingSphere = new Cesium.BoundingSphere(this.center, this.boundingSphere.radius);
    }
    linearTransformAroundCenter(matrix, center, result) {
        const translationToCenter = Cesium.Matrix4.fromTranslation(center.clone());
        const translationBack = Cesium.Matrix4.fromTranslation(Cesium.Cartesian3.negate(center, new Cesium.Cartesian3()));
        Cesium.Matrix4.multiply(result, translationToCenter, result);
        if (matrix instanceof Cesium.Matrix4) {
            Cesium.Matrix4.multiply(result, matrix.clone(), result);
        }
        else if (matrix instanceof Cesium.Matrix3) {
            Cesium.Matrix4.multiplyByMatrix3(result, matrix.clone(), result);
        }
        Cesium.Matrix4.multiply(result, translationBack, result);
    }
    updateTranslation(matrix) {
        var _a;
        const modelMatrix = Cesium.Matrix4.IDENTITY.clone();
        Cesium.Matrix4.multiply(modelMatrix, matrix, modelMatrix);
        Cesium.Matrix4.multiply(this.gizmoModesBillboard.modelMatrix, matrix, this.gizmoModesBillboard.modelMatrix);
        this.updateBoundingSphere(modelMatrix);
        const linearMatrix = Cesium.Matrix4.getMatrix3(this.element.modelMatrix, new Cesium.Matrix4());
        const linearMatrixInverse = Cesium.Matrix3.inverse(linearMatrix, new Cesium.Matrix3());
        Cesium.Matrix4.multiplyByMatrix3(this.element.modelMatrix, linearMatrixInverse, this.element.modelMatrix);
        Cesium.Matrix4.multiply(this.element.modelMatrix, modelMatrix, this.element.modelMatrix);
        Cesium.Matrix4.multiplyByMatrix3(this.element.modelMatrix, linearMatrix, this.element.modelMatrix);
        (_a = this.gizmo) === null || _a === void 0 ? void 0 : _a.axises.forEach((axis) => {
            Cesium.Matrix4.multiply(axis.modelMatrix, modelMatrix, axis.modelMatrix);
        });
    }
    updateRotation(rotationMatrix) {
        var _a;
        const cacheRotationInverse = Cesium.Matrix4.inverse(this.elementCachedRotationMatrix, new Cesium.Matrix4());
        this.linearTransformAroundCenter(cacheRotationInverse, this.elementCenterRelativeBoundingSphere, this.element.modelMatrix);
        this.linearTransformAroundCenter(rotationMatrix, this.elementCenterRelativeBoundingSphere, this.element.modelMatrix);
        this.linearTransformAroundCenter(this.elementCachedRotationMatrix, this.elementCenterRelativeBoundingSphere, this.element.modelMatrix);
        Cesium.Matrix4.multiply(this.gizmoCachedRotationMatrix, rotationMatrix, this.gizmoCachedRotationMatrix);
        (_a = this.gizmo) === null || _a === void 0 ? void 0 : _a.axises.forEach((axis, index) => {
            const linearMatrix = Cesium.Matrix4.getMatrix3(this.gizmo.cachedModelMatrixs[index], new Cesium.Matrix3());
            const linearMatrixInverse = Cesium.Matrix3.inverse(linearMatrix, new Cesium.Matrix3());
            this.linearTransformAroundCenter(linearMatrixInverse, this.center, axis.modelMatrix);
            this.linearTransformAroundCenter(rotationMatrix, this.center, axis.modelMatrix);
            this.linearTransformAroundCenter(linearMatrix, this.center, axis.modelMatrix);
        });
    }
    updateScale(scaleMatrix) {
        var _a;
        Cesium.Matrix4.multiply(this.gizmoCachedScaleMatrix, scaleMatrix, this.gizmoCachedScaleMatrix);
        const direction = this.gizmo.directions[this.activeAxisType];
        const relativeDirection = this.gizmo.relativeDirections[this.activeAxisType];
        // const directionAfterScale = Cesium.Matrix4.multiplyByPointAsVector(
        //   scaleMatrix,
        //   direction,
        //   new Cesium.Cartesian3()
        // )
        // this.gizmo!.relativeDirections[this.activeAxisType as AxisType] =
        //   directionAfterScale
        const angle = Cesium.Cartesian3.angleBetween(direction, relativeDirection);
        const rotationAfterScale = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromQuaternion(Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.cross(direction, relativeDirection, new Cesium.Cartesian3()), angle)), Cesium.Cartesian3.ZERO, new Cesium.Matrix4());
        const rotationAfterScaleInverse = Cesium.Matrix4.inverse(rotationAfterScale, new Cesium.Matrix4());
        // const rotation = Cesium.Matrix4.fromRotation(Cesium.Matrix4.getRotation(this.element.modelMatrix, new Cesium.Matrix3()))
        const cacheRotationInverse = Cesium.Matrix4.inverse(this.elementCachedRotationMatrix, new Cesium.Matrix4());
        this.linearTransformAroundCenter(cacheRotationInverse, this.elementCenterRelativeBoundingSphere, this.element.modelMatrix);
        this.linearTransformAroundCenter(rotationAfterScaleInverse, this.elementCenterRelativeBoundingSphere, this.element.modelMatrix);
        this.linearTransformAroundCenter(scaleMatrix, this.elementCenterRelativeBoundingSphere, this.element.modelMatrix);
        this.linearTransformAroundCenter(rotationAfterScale, this.elementCenterRelativeBoundingSphere, this.element.modelMatrix);
        this.linearTransformAroundCenter(this.elementCachedRotationMatrix, this.elementCenterRelativeBoundingSphere, this.element.modelMatrix);
        (_a = this.gizmo) === null || _a === void 0 ? void 0 : _a.axises.forEach((axis) => {
            const id = axis.geometryInstances.id;
            if (id.includes('box')) {
                this.linearTransformAroundCenter(scaleMatrix, Cesium.Cartesian3.ZERO.clone(), axis.modelMatrix);
            }
            else {
                if (this.activeAxisType == id) {
                    this.linearTransformAroundCenter(rotationAfterScaleInverse, this.center, axis.modelMatrix);
                    this.linearTransformAroundCenter(scaleMatrix, this.center, axis.modelMatrix);
                    this.linearTransformAroundCenter(rotationAfterScale, this.center, axis.modelMatrix);
                }
            }
        });
    }
    getPointToCenterRay(point) {
        const centerToPoint = Cesium.Cartesian3.subtract(point, this.center, new Cesium.Cartesian3());
        return new Cesium.Ray(this.center, Cesium.Cartesian3.normalize(centerToPoint, new Cesium.Cartesian3()));
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
        const modelMatrix = Cesium.Matrix4.IDENTITY.clone();
        const direction = this.gizmo.directions[this.activeAxisType];
        if (this.mode === ModeCollection.TRANSLATION ||
            this.mode === ModeCollection.SCALE) {
            const offset = Cesium.Cartesian3.subtract(endIntersection, startIntersection, new Cesium.Cartesian3());
            const distanceByDirection = Cesium.Cartesian3.dot(offset, direction.clone());
            Cesium.Cartesian3.multiplyByScalar(direction, distanceByDirection, offset);
            if (this.mode === ModeCollection.TRANSLATION) {
                const translation = Cesium.Matrix4.fromTranslation(offset);
                this.updateTranslation(translation);
            }
            if (this.mode === ModeCollection.SCALE) {
                const distanceToCamera = Cesium.Cartesian3.distance(scene.camera.position, this.center);
                const scaleElements = [1, 1, 1];
                scaleElements[this.activeAxisType] =
                    (distanceByDirection / distanceToCamera) * 5 + 1;
                const scale = Cesium.Matrix4.fromScale(Cesium.Cartesian3.fromArray(scaleElements));
                this.updateScale(scale);
            }
        }
        if (this.mode === ModeCollection.ROTATION) {
            const centerToStartIntersectionRay = this.getPointToCenterRay(startIntersection);
            const centerToEndIntersectionRay = this.getPointToCenterRay(endIntersection);
            const cross = Cesium.Cartesian3.cross(centerToStartIntersectionRay.direction, centerToEndIntersectionRay.direction, new Cesium.Cartesian3());
            const number = Cesium.Cartesian3.dot(cross, plane.normal);
            const signal = number / (number ? Math.abs(number) : 1);
            const startPoint = Cesium.Ray.getPoint(centerToStartIntersectionRay, this.gizmo.radius);
            const endPoint = Cesium.Ray.getPoint(centerToEndIntersectionRay, this.gizmo.radius);
            const angle = Cesium.Cartesian3.angleBetween(centerToStartIntersectionRay.direction || startPoint, centerToEndIntersectionRay.direction || endPoint);
            if (!this.intersectStartPoint) {
                this.intersectStartPoint = this.pointPrimitiveCollection.add({
                    color: Cesium.Color.YELLOW,
                    position: startPoint,
                    pixelSize: 10,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                });
            }
            if (!this.intersectEndPoint) {
                this.intersectEndPoint = this.pointPrimitiveCollection.add({
                    color: Cesium.Color.YELLOW,
                    position: endPoint,
                    pixelSize: 10,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                });
            }
            else {
                this.intersectEndPoint.position = endPoint;
            }
            const translationToCenter = Cesium.Matrix4.fromTranslation(this.cachedCenter.clone());
            const rotation = Cesium.Quaternion.fromAxisAngle(direction, angle * signal);
            const rotationMatrix = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromQuaternion(rotation));
            const translationBack = Cesium.Matrix4.fromTranslation(Cesium.Cartesian3.negate(this.cachedCenter, new Cesium.Cartesian3()));
            Cesium.Matrix4.multiply(modelMatrix, translationToCenter, modelMatrix);
            Cesium.Matrix4.multiply(modelMatrix, rotationMatrix, modelMatrix);
            Cesium.Matrix4.multiply(modelMatrix, translationBack, modelMatrix);
            this.updateRotation(rotationMatrix);
        }
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
        var _a;
        this.detoryHandler();
        (_a = this.gizmo) === null || _a === void 0 ? void 0 : _a.destory();
        document.removeEventListener('keyup', this.keyEvent);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLE1BQU0sTUFBTSxRQUFRLENBQUE7QUFDaEMsT0FBTyxlQUFlLE1BQU0sbUJBQW1CLENBQUE7QUFDL0MsT0FBTyxZQUFZLE1BQU0sZ0JBQWdCLENBQUE7QUFDekMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLFlBQVksQ0FBQTtBQUNyQyxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sUUFBUSxDQUFBO0FBQ3ZDLE9BQU8sV0FBVyxNQUFNLDJCQUEyQixDQUFBO0FBQ25ELE9BQU8sUUFBUSxNQUFNLHdCQUF3QixDQUFBO0FBQzdDLE9BQU8sS0FBSyxNQUFNLHFCQUFxQixDQUFBO0FBQ3ZDLE9BQU8sTUFBTSxNQUFNLHVCQUF1QixDQUFBO0FBQzFDLE9BQU8sU0FBUyxNQUFNLGFBQWEsQ0FBQTtBQWtCbkMsTUFBTSxDQUFDLE9BQU8sT0FBTyxXQUFXO0lBMEQ5QixZQUFZLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxjQUFjLEVBQVc7UUFuRC9DLHdDQUFtQyxHQUN6QyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQTtRQUV4Qiw4QkFBeUIsR0FDL0IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUE7UUFFekIsMkJBQXNCLEdBQzVCLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFBO1FBRXpCLGdDQUEyQixHQUNqQyxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtRQUNqQyw2QkFBd0IsR0FBbUIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUE7UUFXbEUsd0JBQW1CLEdBQ3pCLElBQUksTUFBTSxDQUFDLG1CQUFtQixFQUFFLENBQUE7UUE2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