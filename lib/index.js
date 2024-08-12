import * as Cesium from 'cesium';
import TranslationAxis from './translationAxis';
import RotationAxis from './rotationAxis';
import { AxisType } from './baseAxis';
import { ModeCollection } from './type';
import translation from '../assets/translation.png';
import rotation from '../assets/rotation.png';
import scale from '../assets/scale.png';
import scale1 from '../assets/scale_1.png';
export default class Transformer {
    constructor({ scene, element, boundingSphere }) {
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
            this.gizmo = new TranslationAxis({
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
        // if (this.mode !== ModeCollection.ROTATION) return
        if (this.mode === ModeCollection.ROTATION) {
            const direction = this.gizmo.directions[this.activeAxisType].clone();
            Cesium.Matrix4.multiplyByPointAsVector(this.gizmo.axises[0].modelMatrix, direction, direction);
            this.plane = Cesium.Plane.fromPointNormal(this.center, Cesium.Cartesian3.normalize(direction, new Cesium.Cartesian3()));
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
                axisArray.includes(Number(axis.id))) {
                return {
                    activeAxis: axis.primitive,
                    activeAxisType: Number(axis.id)
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
            Cesium.Matrix4.multiply(result, matrix, result);
        }
        else if (matrix instanceof Cesium.Matrix3) {
            Cesium.Matrix4.multiplyByMatrix3(result, matrix, result);
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
        (_a = this.gizmo) === null || _a === void 0 ? void 0 : _a.axises.forEach((axis) => {
            this.linearTransformAroundCenter(rotationMatrix, this.center, axis.modelMatrix);
        });
    }
    updateScale(scaleMatrix) {
        var _a;
        this.linearTransformAroundCenter(scaleMatrix, this.cachedCenter, this.element.modelMatrix);
        (_a = this.gizmo) === null || _a === void 0 ? void 0 : _a.axises.forEach((axis) => {
            this.linearTransformAroundCenter(scaleMatrix, this.center, axis.modelMatrix);
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
                const scale = Cesium.Matrix4.fromScale(new Cesium.Cartesian3((distanceByDirection / distanceToCamera) * 10 + 1, (distanceByDirection / distanceToCamera) * 10 + 1, (distanceByDirection / distanceToCamera) * 10 + 1)
                // Cesium.Cartesian3.multiplyByScalar(
                //   direction,
                //   (distanceByDirection / distanceToCamera) * 10 + 1,
                //   new Cesium.Cartesian3()
                // )
                );
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLE1BQU0sTUFBTSxRQUFRLENBQUE7QUFDaEMsT0FBTyxlQUFlLE1BQU0sbUJBQW1CLENBQUE7QUFDL0MsT0FBTyxZQUFZLE1BQU0sZ0JBQWdCLENBQUE7QUFDekMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLFlBQVksQ0FBQTtBQUNyQyxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sUUFBUSxDQUFBO0FBQ3ZDLE9BQU8sV0FBVyxNQUFNLDJCQUEyQixDQUFBO0FBQ25ELE9BQU8sUUFBUSxNQUFNLHdCQUF3QixDQUFBO0FBQzdDLE9BQU8sS0FBSyxNQUFNLHFCQUFxQixDQUFBO0FBQ3ZDLE9BQU8sTUFBTSxNQUFNLHVCQUF1QixDQUFBO0FBZ0IxQyxNQUFNLENBQUMsT0FBTyxPQUFPLFdBQVc7SUErQzlCLFlBQVksRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBVztRQXhDL0MsZ0NBQTJCLEdBQ2pDLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFBO1FBQ3pCLDZCQUF3QixHQUM5QixNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtRQVV6Qix3QkFBbUIsR0FDekIsSUFBSSxNQUFNLENBQUMsbUJBQW1CLEVBQUUsQ0FBQTtRQTJCaEMsSUFBSSxDQUFDLEtBQUs7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUE7UUFFaEQsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7UUFFbEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7UUFDdEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUE7UUFFNUMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FB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