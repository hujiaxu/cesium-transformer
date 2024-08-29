import * as Cesium from 'cesium';
import TranslationAxis from './translationAxis';
import RotationAxis from './rotationAxis';
import ScaleAxis from './scaleAxis';
import { ModeCollection, AxisType } from './type';
export default class Transformer {
    constructor({ scene, element, boundingSphere }) {
        this.elementCenterRelativeBoundingSphere = Cesium.Cartesian3.ZERO.clone();
        this.elementCachedRotationMatrix = Cesium.Matrix4.IDENTITY.clone();
        this.elementCachedScaleMatrix = Cesium.Matrix4.IDENTITY.clone();
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
        this.registerHandler();
    }
    changeMode(mode) {
        var _a, _b;
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
        (_b = this.gizmo) === null || _b === void 0 ? void 0 : _b.initCachedMatrix();
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
            const resultDirection = Cesium.Matrix4.multiplyByPointAsVector(this.gizmo.cachedRotationMatrix, direction, new Cesium.Cartesian3());
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
        Cesium.Matrix4.multiply(this.gizmo.cachedRotationMatrix, rotationMatrix, this.gizmo.cachedRotationMatrix);
        (_a = this.gizmo) === null || _a === void 0 ? void 0 : _a.axises.forEach((axis, index) => {
            const linearMatrix = Cesium.Matrix4.getMatrix3(this.gizmo.cachedModelMatrixs[index], new Cesium.Matrix3());
            const linearMatrixInverse = Cesium.Matrix3.inverse(linearMatrix, new Cesium.Matrix3());
            this.linearTransformAroundCenter(linearMatrixInverse, this.center, axis.modelMatrix);
            this.linearTransformAroundCenter(rotationMatrix, this.center, axis.modelMatrix);
            this.linearTransformAroundCenter(linearMatrix, this.center, axis.modelMatrix);
        });
    }
    updateScale(scaleMatrix, scaleFactor) {
        var _a;
        Cesium.Matrix4.multiply(this.gizmo.cachedScaleMatrix[this.activeAxisType], Cesium.Matrix4.fromScale(Cesium.Cartesian3.fromArray([scaleFactor, scaleFactor, scaleFactor])), this.gizmo.cachedScaleMatrix[this.activeAxisType]);
        const direction = this.gizmo.directions[this.activeAxisType];
        const relativeDirection = this.gizmo.relativeDirections[this.activeAxisType];
        const angle = Cesium.Cartesian3.angleBetween(direction, relativeDirection);
        const rotationBeforeScale = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromQuaternion(Cesium.Quaternion.fromAxisAngle(Cesium.Cartesian3.cross(direction, relativeDirection, new Cesium.Cartesian3()), angle)), Cesium.Cartesian3.ZERO, new Cesium.Matrix4());
        const rotationBeforeScaleInverse = Cesium.Matrix4.inverse(rotationBeforeScale, new Cesium.Matrix4());
        const cacheRotationInverse = Cesium.Matrix4.inverse(this.elementCachedRotationMatrix, new Cesium.Matrix4());
        this.linearTransformAroundCenter(cacheRotationInverse, this.elementCenterRelativeBoundingSphere, this.element.modelMatrix);
        this.linearTransformAroundCenter(rotationBeforeScaleInverse, this.elementCenterRelativeBoundingSphere, this.element.modelMatrix);
        this.linearTransformAroundCenter(scaleMatrix, this.elementCenterRelativeBoundingSphere, this.element.modelMatrix);
        this.linearTransformAroundCenter(rotationBeforeScale, this.elementCenterRelativeBoundingSphere, this.element.modelMatrix);
        this.linearTransformAroundCenter(this.elementCachedRotationMatrix, this.elementCenterRelativeBoundingSphere, this.element.modelMatrix);
        (_a = this.gizmo) === null || _a === void 0 ? void 0 : _a.axises.forEach((axis) => {
            const id = axis.geometryInstances.id;
            if (id.includes('box')) {
                const result = this.gizmo.directionsWithLength[this.activeAxisType].clone();
                Cesium.Matrix4.multiplyByPointAsVector(this.gizmo.cachedScaleMatrix[this.activeAxisType], result, result);
                const translation = Cesium.Cartesian3.add(this.center, result, new Cesium.Cartesian3());
                if (this.intersectEndPoint) {
                    this.intersectEndPoint.position = Cesium.Cartesian3.add(this.center, result, new Cesium.Cartesian3());
                }
                if (id.includes(this.activeAxisType)) {
                    axis.modelMatrix =
                        Cesium.Transforms.eastNorthUpToFixedFrame(translation);
                }
            }
            else if (this.activeAxisType == id) {
                this.linearTransformAroundCenter(rotationBeforeScaleInverse, this.center, axis.modelMatrix);
                this.linearTransformAroundCenter(scaleMatrix, this.center, axis.modelMatrix);
                this.linearTransformAroundCenter(rotationBeforeScale, this.center, axis.modelMatrix);
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
                const scaleFactor = (distanceByDirection / distanceToCamera) * 5 + 1;
                const scaleElements = [1, 1, 1];
                scaleElements[this.activeAxisType] = scaleFactor;
                const scale = Cesium.Matrix4.fromScale(Cesium.Cartesian3.fromArray(scaleElements));
                this.updateScale(scale, scaleFactor);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxLQUFLLE1BQU0sTUFBTSxRQUFRLENBQUE7QUFDaEMsT0FBTyxlQUFlLE1BQU0sbUJBQW1CLENBQUE7QUFDL0MsT0FBTyxZQUFZLE1BQU0sZ0JBQWdCLENBQUE7QUFDekMsT0FBTyxTQUFTLE1BQU0sYUFBYSxDQUFBO0FBQ25DLE9BQU8sRUFDTCxjQUFjLEVBQ2QsUUFBUSxFQUlULE1BQU0sUUFBUSxDQUFBO0FBRWYsTUFBTSxDQUFDLE9BQU8sT0FBTyxXQUFXO0lBaUQ5QixZQUFZLEVBQ1YsS0FBSyxFQUNMLE9BQU8sRUFDUCxjQUFjLEVBQ2dCO1FBOUN4Qix3Q0FBbUMsR0FDekMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUE7UUFFeEIsZ0NBQTJCLEdBQ2pDLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFBO1FBQ2pDLDZCQUF3QixHQUFtQixNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQTtRQTBDeEUsSUFBSSxDQUFDLEtBQUs7WUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUE7UUFFaEQsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7UUFFbEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7UUFDdEIsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUE7UUFFNUMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUM1QyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3hDLElBQUksQ0FBQyxX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