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
        this.getElementRotationMatrix();
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
    }
    getElementRotationMatrix() {
        if (Cesium.Matrix4.equals(this.element.modelMatrix, Cesium.Matrix4.IDENTITY))
            return;
        const rotation = Cesium.Matrix4.getRotation(this.element.modelMatrix, new Cesium.Matrix3());
        this.elementCachedRotationMatrix =
            Cesium.Matrix4.fromRotationTranslation(rotation);
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
        Cesium.Matrix4.multiply(result, matrix, result);
        Cesium.Matrix4.multiply(result, translationBack, result);
    }
    updateTranslation(matrix) {
        var _a;
        const modelMatrix = Cesium.Matrix4.IDENTITY.clone();
        Cesium.Matrix4.multiply(modelMatrix, matrix, modelMatrix);
        Cesium.Matrix4.multiply(this.gizmoModesBillboard.modelMatrix, matrix, this.gizmoModesBillboard.modelMatrix);
        this.updateBoundingSphere(modelMatrix);
        const elementRotationMatrix = Cesium.Matrix4.getRotation(this.element.modelMatrix, new Cesium.Matrix3());
        const elementRotationMatrixInverse = Cesium.Matrix3.inverse(elementRotationMatrix, new Cesium.Matrix3());
        Cesium.Matrix4.multiplyByMatrix3(this.element.modelMatrix, elementRotationMatrixInverse, this.element.modelMatrix);
        Cesium.Matrix4.multiply(this.element.modelMatrix, modelMatrix, this.element.modelMatrix);
        Cesium.Matrix4.multiplyByMatrix3(this.element.modelMatrix, elementRotationMatrix, this.element.modelMatrix);
        (_a = this.gizmo) === null || _a === void 0 ? void 0 : _a.axises.forEach((axis) => {
            Cesium.Matrix4.multiply(axis.modelMatrix, modelMatrix, axis.modelMatrix);
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
        // Cesium.Matrix4.multiply(
        //   this.element.modelMatrix,
        //   scaleMatrix,
        //   this.element.modelMatrix
        // )
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLE1BQU0sTUFBTSxRQUFRLENBQUE7QUFDaEMsT0FBTyxlQUFlLE1BQU0sbUJBQW1CLENBQUE7QUFDL0MsT0FBTyxZQUFZLE1BQU0sZ0JBQWdCLENBQUE7QUFDekMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLFlBQVksQ0FBQTtBQUNyQyxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sUUFBUSxDQUFBO0FBQ3ZDLE9BQU8sV0FBVyxNQUFNLDJCQUEyQixDQUFBO0FBQ25ELE9BQU8sUUFBUSxNQUFNLHdCQUF3QixDQUFBO0FBQzdDLE9BQU8sS0FBSyxNQUFNLHFCQUFxQixDQUFBO0FBQ3ZDLE9BQU8sTUFBTSxNQUFNLHVCQUF1QixDQUFBO0FBZ0IxQyxNQUFNLENBQUMsT0FBTyxPQUFPLFdBQVc7SUE2QzlCLFlBQVksRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBVztRQXRDL0MsZ0NBQTJCLEdBQ2pDLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFBO1FBVXpCLHdCQUFtQixHQUN6QixJQUFJLE1BQU0sQ0FBQyxtQkFBbUIsRUFBRSxDQUFBO1FBMkJoQyxJQUFJLENBQUMsS0FBSztZQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQTtRQUVoRCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtRQUVsQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtRQUN0QixJQUFJLENBQUMsY0FBYyxHQUFHLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtRQUU1QyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQzVDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxD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