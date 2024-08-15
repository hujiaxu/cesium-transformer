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
        this.gizmoCachedRotationMatrix = Cesium.Matrix4.IDENTITY.clone();
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
        this.cachedCenter = this.center.clone();
        this.changeMode(ModeCollection.TRANSLATION);
        document.addEventListener('keyup', (e) => {
            if (e.key === 'w') {
                this.changeMode(ModeCollection.TRANSLATION);
            }
            if (e.key === 'e') {
                this.changeMode(ModeCollection.ROTATION);
            }
            if (e.key === 'r') {
                this.changeMode(ModeCollection.SCALE);
            }
        });
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
        var _a;
        if (!this.gizmo)
            return;
        if (Cesium.Matrix4.equals(this.element.modelMatrix, Cesium.Matrix4.IDENTITY))
            return;
        const rotation = Cesium.Matrix4.getRotation(this.element.modelMatrix, new Cesium.Matrix3());
        this.elementCachedRotationMatrix =
            Cesium.Matrix4.fromRotationTranslation(rotation);
        const elementScale = Cesium.Matrix4.getScale(this.element.modelMatrix, new Cesium.Cartesian3());
        this.gizmo.radius *= elementScale.x;
        const elementScaleMatrix = Cesium.Matrix4.fromScale(elementScale, new Cesium.Matrix4());
        this.elementCachedScaleMatrix = elementScaleMatrix;
        this.gizmoCachedRotationMatrix = Cesium.Matrix4.IDENTITY.clone();
        (_a = this.gizmo) === null || _a === void 0 ? void 0 : _a.axises.forEach((axis) => {
            this.linearTransformAroundCenter(elementScaleMatrix, this.center, axis.modelMatrix);
        });
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
        const elementScaleMatrixInverse = Cesium.Matrix4.inverse(this.elementCachedScaleMatrix, new Cesium.Matrix4());
        const linearMatrix = Cesium.Matrix4.getMatrix3(this.element.modelMatrix, new Cesium.Matrix4());
        const linearMatrixInverse = Cesium.Matrix3.inverse(linearMatrix, new Cesium.Matrix3());
        Cesium.Matrix4.multiplyByMatrix3(this.element.modelMatrix, linearMatrixInverse, this.element.modelMatrix);
        Cesium.Matrix4.multiply(this.element.modelMatrix, modelMatrix, this.element.modelMatrix);
        Cesium.Matrix4.multiplyByMatrix3(this.element.modelMatrix, linearMatrix, this.element.modelMatrix);
        (_a = this.gizmo) === null || _a === void 0 ? void 0 : _a.axises.forEach((axis) => {
            this.linearTransformAroundCenter(elementScaleMatrixInverse, this.center, axis.modelMatrix);
            Cesium.Matrix4.multiply(axis.modelMatrix, modelMatrix, axis.modelMatrix);
            this.linearTransformAroundCenter(this.elementCachedScaleMatrix, this.center, axis.modelMatrix);
        });
    }
    updateRotation(rotationMatrix) {
        var _a;
        const cacheRotationInverse = Cesium.Matrix4.inverse(this.elementCachedRotationMatrix, new Cesium.Matrix4());
        this.linearTransformAroundCenter(cacheRotationInverse, this.cachedCenter, this.element.modelMatrix);
        this.linearTransformAroundCenter(rotationMatrix, this.cachedCenter, this.element.modelMatrix);
        this.linearTransformAroundCenter(this.elementCachedRotationMatrix, this.cachedCenter, this.element.modelMatrix);
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
        this.linearTransformAroundCenter(scaleMatrix, this.cachedCenter, this.element.modelMatrix);
        (_a = this.gizmo) === null || _a === void 0 ? void 0 : _a.axises.forEach((axis) => {
            const id = axis.geometryInstances.id;
            if (id.includes('box')) {
                this.linearTransformAroundCenter(scaleMatrix, Cesium.Cartesian3.ZERO.clone(), axis.modelMatrix);
            }
            else {
                this.linearTransformAroundCenter(scaleMatrix, this.center, axis.modelMatrix);
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
                    (distanceByDirection / distanceToCamera) * 10 + 1;
                const scale = Cesium.Matrix4.fromScale(Cesium.Cartesian3.fromArray(scaleElements));
                // const scale = Cesium.Matrix4.fromScale(offset)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLE1BQU0sTUFBTSxRQUFRLENBQUE7QUFDaEMsT0FBTyxlQUFlLE1BQU0sbUJBQW1CLENBQUE7QUFDL0MsT0FBTyxZQUFZLE1BQU0sZ0JBQWdCLENBQUE7QUFDekMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLFlBQVksQ0FBQTtBQUNyQyxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sUUFBUSxDQUFBO0FBQ3ZDLE9BQU8sV0FBVyxNQUFNLDJCQUEyQixDQUFBO0FBQ25ELE9BQU8sUUFBUSxNQUFNLHdCQUF3QixDQUFBO0FBQzdDLE9BQU8sS0FBSyxNQUFNLHFCQUFxQixDQUFBO0FBQ3ZDLE9BQU8sTUFBTSxNQUFNLHVCQUF1QixDQUFBO0FBQzFDLE9BQU8sU0FBUyxNQUFNLGFBQWEsQ0FBQTtBQWdCbkMsTUFBTSxDQUFDLE9BQU8sT0FBTyxXQUFXO0lBa0Q5QixZQUFZLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxjQUFjLEVBQVc7UUEzQy9DLDhCQUF5QixHQUMvQixNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtRQUV6QixnQ0FBMkIsR0FDakMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUE7UUFDakMsNkJBQXdCLEdBQW1CLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFBO1FBV2xFLHdCQUFtQixHQUN6QixJQUFJLE1BQU0sQ0FBQyxtQkFBbUIsRUFBRSxDQUFBO1FBMkJoQyxJQUFJLENBQUMsS0FBSztZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQTtRQUVoRCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtRQUVsQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8s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