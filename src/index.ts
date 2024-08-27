import * as Cesium from 'cesium'
import TranslationAxis from './translationAxis'
import RotationAxis from './rotationAxis'
import { AxisType } from './baseAxis'
import { ModeCollection } from './type'
import translation from '../assets/translation.png'
import rotation from '../assets/rotation.png'
import scale from '../assets/scale.png'
import scale1 from '../assets/scale_1.png'
import ScaleAxis from './scaleAxis'

type elementType = Cesium.Primitive | Cesium.Cesium3DTileset | Cesium.Model

interface Options {
  scene: Cesium.Scene

  element: elementType

  boundingSphere: Cesium.BoundingSphere
}

interface PickObjectInterface {
  primitive: Cesium.Primitive

  id: AxisType
}

export default class Transformer {
  public scene: Cesium.Scene

  public element: elementType

  private boundingSphere: Cesium.BoundingSphere

  private elementCenterRelativeBoundingSphere: Cesium.Cartesian3 =
    Cesium.Cartesian3.ZERO.clone()

  private gizmoCachedRotationMatrix: Cesium.Matrix4 =
    Cesium.Matrix4.IDENTITY.clone()

  private gizmoCachedScaleMatrix: Cesium.Matrix4 =
    Cesium.Matrix4.IDENTITY.clone()

  private elementCachedRotationMatrix: Cesium.Matrix4 =
    Cesium.Matrix4.IDENTITY.clone()
  elementCachedScaleMatrix: Cesium.Matrix4 = Cesium.Matrix4.IDENTITY.clone()

  private cachedCenter: Cesium.Cartesian3 | undefined
  private center: Cesium.Cartesian3 | undefined
  private handler: Cesium.ScreenSpaceEventHandler | undefined
  private activeAxis: Cesium.Primitive | undefined
  private activeAxisType: AxisType | undefined

  private gizmo: TranslationAxis | RotationAxis | ScaleAxis | undefined
  // private testGizmo: TranslationAxis | RotationAxis | ScaleAxis | undefined
  private mode: ModeCollection | undefined
  private gizmoModesBillboard: Cesium.BillboardCollection =
    new Cesium.BillboardCollection()

  private intersectStartPoint: Cesium.PointPrimitive | undefined
  private intersectEndPoint: Cesium.PointPrimitive | undefined
  private pointPrimitiveCollection: Cesium.PointPrimitiveCollection | undefined

  private plane: Cesium.Plane | undefined

  private onMouseDown: ({
    position
  }: {
    position: Cesium.Cartesian2
  }) => void | undefined
  private onMouseUp: ({
    position
  }: {
    position: Cesium.Cartesian2
  }) => void | undefined
  private onMouseMove: ({
    startPosition,
    endPosition
  }: {
    startPosition: Cesium.Cartesian2
    endPosition: Cesium.Cartesian2
  }) => void

  private keyEvent: (e: KeyboardEvent) => void

  constructor({ scene, element, boundingSphere }: Options) {
    if (!scene) throw new Error('scene is required')

    this.scene = scene

    this.element = element
    this.boundingSphere = boundingSphere.clone()

    this.onMouseDown = this.mouseDown.bind(this)
    this.onMouseUp = this.mouseUp.bind(this)
    this.onMouseMove = this.mouseMove.bind(this)

    const keyEvent = (e: KeyboardEvent) => {
      if (e.key === 'w') {
        this.changeMode(ModeCollection.TRANSLATION)
      }
      if (e.key === 'e') {
        this.changeMode(ModeCollection.ROTATION)
      }
      if (e.key === 'r') {
        this.changeMode(ModeCollection.SCALE)
      }
    }
    this.keyEvent = keyEvent.bind(this)

    this.init()
  }

  get isDetoryed() {
    return this.handler === undefined
  }

  private init() {
    if (!this.element || !this.boundingSphere)
      throw new Error('element and boundingSphere are required')

    const pointPrimitiveCollection = new Cesium.PointPrimitiveCollection()
    this.scene.primitives.add(pointPrimitiveCollection)
    this.pointPrimitiveCollection = pointPrimitiveCollection

    const elementTranslation = Cesium.Matrix4.getTranslation(
      this.element.modelMatrix,
      new Cesium.Cartesian3()
    )
    this.elementCenterRelativeBoundingSphere = Cesium.Cartesian3.subtract(
      this.boundingSphere.center,
      elementTranslation,
      new Cesium.Cartesian3()
    )

    this.center = this.boundingSphere.center
    this.cachedCenter = this.center.clone()

    this.changeMode(ModeCollection.SCALE)

    document.addEventListener('keyup', this.keyEvent)

    // this.initGizmo()

    this.registerHandler()
  }
  initGizmo() {
    this.scene.primitives.add(this.gizmoModesBillboard)

    const billboardIds = ['translation', 'rotation', 'scale', 'scale1']
    const images = [translation, rotation, scale, scale1]
    const horizontalOrigins = [
      Cesium.HorizontalOrigin.RIGHT,
      Cesium.HorizontalOrigin.LEFT,
      Cesium.HorizontalOrigin.RIGHT,
      Cesium.HorizontalOrigin.LEFT
    ]
    const verticalOrigins = [
      Cesium.VerticalOrigin.BOTTOM,
      Cesium.VerticalOrigin.BOTTOM,
      Cesium.VerticalOrigin.TOP,
      Cesium.VerticalOrigin.TOP
    ]
    billboardIds.forEach((id, index) => {
      this.gizmoModesBillboard.add({
        position: this.center!,
        image: images[index],
        id,
        scale: 1 / 3,
        horizontalOrigin: horizontalOrigins[index],
        verticalOrigin: verticalOrigins[index],
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      })
    })
  }
  changeMode(mode: ModeCollection) {
    if (this.mode === mode) return
    this.mode = mode
    this.gizmo?.destory()

    if (mode === ModeCollection.TRANSLATION) {
      this.gizmo = new TranslationAxis({
        scene: this.scene,
        boundingSphere: this.boundingSphere
      })
    }
    if (mode === ModeCollection.ROTATION) {
      this.gizmo = new RotationAxis({
        scene: this.scene,
        boundingSphere: this.boundingSphere
      })
    }
    if (mode === ModeCollection.SCALE) {
      this.gizmo = new ScaleAxis({
        scene: this.scene,
        boundingSphere: this.boundingSphere
      })
    }
    this.applyLinearMatrixToGizmo()
  }

  private applyLinearMatrixToGizmo() {
    if (!this.gizmo) return
    if (
      Cesium.Matrix4.equals(this.element.modelMatrix, Cesium.Matrix4.IDENTITY)
    )
      return
    const rotation = Cesium.Matrix4.getRotation(
      this.element.modelMatrix,
      new Cesium.Matrix3()
    )
    this.elementCachedRotationMatrix =
      Cesium.Matrix4.fromRotationTranslation(rotation)

    const elementScale = Cesium.Matrix4.getScale(
      this.element.modelMatrix,
      new Cesium.Cartesian3()
    )
    const elementScaleMatrix = Cesium.Matrix4.fromScale(
      elementScale,
      new Cesium.Matrix4()
    )
    this.elementCachedScaleMatrix = elementScaleMatrix

    this.gizmoCachedRotationMatrix = Cesium.Matrix4.IDENTITY.clone()
  }

  private createPlane() {
    if (!this.center) return

    if (!this.gizmo) return

    if (this.mode === ModeCollection.ROTATION) {
      const direction = this.gizmo.directions[this.activeAxisType!].clone()
      return Cesium.Plane.fromPointNormal(
        this.center,
        Cesium.Cartesian3.normalize(direction, new Cesium.Cartesian3())
      )
    }

    const normalCameraDirection = Cesium.Cartesian3.normalize(
      this.scene!.camera.direction,
      new Cesium.Cartesian3()
    )

    const plane = Cesium.Plane.fromPointNormal(
      this.center,
      normalCameraDirection
    )

    return plane
  }

  private updatePlane() {
    if (!this.center) return

    if (!this.gizmo) return
    if (this.mode === ModeCollection.ROTATION) {
      const direction = this.gizmo.directions[this.activeAxisType!].clone()

      const resultDirection = Cesium.Matrix4.multiplyByPointAsVector(
        this.gizmoCachedRotationMatrix,
        direction,
        new Cesium.Cartesian3()
      )

      this.plane = Cesium.Plane.fromPointNormal(
        this.center,
        Cesium.Cartesian3.normalize(resultDirection, new Cesium.Cartesian3())
      )
    } else {
      this.plane = this.createPlane()
    }
  }

  private getActiveAxisFromMouse(
    pickObjects: PickObjectInterface[] | undefined
  ) {
    if (!pickObjects || pickObjects.length === 0) return undefined

    const axisArray = [AxisType.X, AxisType.Y, AxisType.Z]

    for (const axis of pickObjects) {
      if (
        axis?.primitive instanceof Cesium.Primitive &&
        axisArray.includes(Number(axis.id.toString().split('-')[0]))
      ) {
        return {
          activeAxis: axis.primitive,
          activeAxisType: Number(axis.id.toString().split('-')[0])
        }
      }
    }
  }

  private updateBoundingSphere(modelMatrix: Cesium.Matrix4) {
    Cesium.Matrix4.multiplyByPoint(modelMatrix, this.center!, this.center!)
    this.boundingSphere = new Cesium.BoundingSphere(
      this.center,
      this.boundingSphere.radius
    )
  }

  private linearTransformAroundCenter(
    matrix: Cesium.Matrix4 | Cesium.Matrix3,
    center: Cesium.Cartesian3,
    result: Cesium.Matrix4
  ) {
    const translationToCenter = Cesium.Matrix4.fromTranslation(center.clone())
    const translationBack = Cesium.Matrix4.fromTranslation(
      Cesium.Cartesian3.negate(center, new Cesium.Cartesian3())
    )

    Cesium.Matrix4.multiply(result, translationToCenter, result)
    if (matrix instanceof Cesium.Matrix4) {
      Cesium.Matrix4.multiply(result, matrix.clone(), result)
    } else if (matrix instanceof Cesium.Matrix3) {
      Cesium.Matrix4.multiplyByMatrix3(result, matrix.clone(), result)
    }
    Cesium.Matrix4.multiply(result, translationBack, result)
  }

  private updateTranslation(matrix: Cesium.Matrix4) {
    const modelMatrix = Cesium.Matrix4.IDENTITY.clone()

    Cesium.Matrix4.multiply(modelMatrix, matrix, modelMatrix)
    Cesium.Matrix4.multiply(
      this.gizmoModesBillboard.modelMatrix,
      matrix,
      this.gizmoModesBillboard.modelMatrix
    )

    this.updateBoundingSphere(modelMatrix)

    const linearMatrix = Cesium.Matrix4.getMatrix3(
      this.element.modelMatrix,
      new Cesium.Matrix4()
    )
    const linearMatrixInverse = Cesium.Matrix3.inverse(
      linearMatrix,
      new Cesium.Matrix3()
    )

    Cesium.Matrix4.multiplyByMatrix3(
      this.element.modelMatrix,
      linearMatrixInverse,
      this.element.modelMatrix
    )
    Cesium.Matrix4.multiply(
      this.element.modelMatrix,
      modelMatrix,
      this.element.modelMatrix
    )
    Cesium.Matrix4.multiplyByMatrix3(
      this.element.modelMatrix,
      linearMatrix,
      this.element.modelMatrix
    )

    this.gizmo?.axises.forEach((axis) => {
      Cesium.Matrix4.multiply(axis.modelMatrix, modelMatrix, axis.modelMatrix)
    })
  }

  private updateRotation(rotationMatrix: Cesium.Matrix4) {
    const cacheRotationInverse = Cesium.Matrix4.inverse(
      this.elementCachedRotationMatrix,
      new Cesium.Matrix4()
    )
    this.linearTransformAroundCenter(
      cacheRotationInverse,
      this.elementCenterRelativeBoundingSphere,
      this.element.modelMatrix
    )
    this.linearTransformAroundCenter(
      rotationMatrix,
      this.elementCenterRelativeBoundingSphere,
      this.element.modelMatrix
    )
    this.linearTransformAroundCenter(
      this.elementCachedRotationMatrix,
      this.elementCenterRelativeBoundingSphere,
      this.element.modelMatrix
    )

    Cesium.Matrix4.multiply(
      this.gizmoCachedRotationMatrix,
      rotationMatrix,
      this.gizmoCachedRotationMatrix
    )
    ;(this.gizmo as RotationAxis)?.axises.forEach((axis, index) => {
      const linearMatrix = Cesium.Matrix4.getMatrix3(
        (this.gizmo as RotationAxis).cachedModelMatrixs[index],
        new Cesium.Matrix3()
      )
      const linearMatrixInverse = Cesium.Matrix3.inverse(
        linearMatrix,
        new Cesium.Matrix3()
      )
      this.linearTransformAroundCenter(
        linearMatrixInverse,
        this.center!,
        axis.modelMatrix
      )
      this.linearTransformAroundCenter(
        rotationMatrix,
        this.center!,
        axis.modelMatrix
      )
      this.linearTransformAroundCenter(
        linearMatrix,
        this.center!,
        axis.modelMatrix
      )
    })
  }

  private updateScale(scaleMatrix: Cesium.Matrix4) {
    Cesium.Matrix4.multiply(
      this.gizmoCachedScaleMatrix,
      scaleMatrix,
      this.gizmoCachedScaleMatrix
    )

    const direction = this.gizmo!.directions[this.activeAxisType as AxisType]
    const relativeDirection =
      this.gizmo!.relativeDirections[this.activeAxisType as AxisType]
    // const directionAfterScale = Cesium.Matrix4.multiplyByPointAsVector(
    //   scaleMatrix,
    //   direction,
    //   new Cesium.Cartesian3()
    // )
    // this.gizmo!.relativeDirections[this.activeAxisType as AxisType] =
    //   directionAfterScale
    const angle = Cesium.Cartesian3.angleBetween(direction, relativeDirection)

    const rotationAfterScale = Cesium.Matrix4.fromRotationTranslation(
      Cesium.Matrix3.fromQuaternion(
        Cesium.Quaternion.fromAxisAngle(
          Cesium.Cartesian3.cross(
            direction,
            relativeDirection,
            new Cesium.Cartesian3()
          ),
          angle
        )
      ),
      Cesium.Cartesian3.ZERO,
      new Cesium.Matrix4()
    )
    const rotationAfterScaleInverse = Cesium.Matrix4.inverse(
      rotationAfterScale,
      new Cesium.Matrix4()
    )
    // const rotation = Cesium.Matrix4.fromRotation(Cesium.Matrix4.getRotation(this.element.modelMatrix, new Cesium.Matrix3()))
    const cacheRotationInverse = Cesium.Matrix4.inverse(
      this.elementCachedRotationMatrix,
      new Cesium.Matrix4()
    )

    this.linearTransformAroundCenter(
      cacheRotationInverse,
      this.elementCenterRelativeBoundingSphere!,
      this.element.modelMatrix
    )
    this.linearTransformAroundCenter(
      rotationAfterScaleInverse,
      this.elementCenterRelativeBoundingSphere!,
      this.element.modelMatrix
    )
    this.linearTransformAroundCenter(
      scaleMatrix,
      this.elementCenterRelativeBoundingSphere!,
      this.element.modelMatrix
    )
    this.linearTransformAroundCenter(
      rotationAfterScale,
      this.elementCenterRelativeBoundingSphere!,
      this.element.modelMatrix
    )
    this.linearTransformAroundCenter(
      this.elementCachedRotationMatrix,
      this.elementCenterRelativeBoundingSphere!,
      this.element.modelMatrix
    )
    this.gizmo?.axises.forEach((axis) => {
      const id = (axis.geometryInstances as Cesium.GeometryInstance).id
      if (id.includes('box')) {
        this.linearTransformAroundCenter(
          scaleMatrix,
          Cesium.Cartesian3.ZERO.clone(),
          axis.modelMatrix
        )
      } else {
        if (this.activeAxisType == id) {
          this.linearTransformAroundCenter(
            rotationAfterScaleInverse,
            this.center!,
            axis.modelMatrix
          )
          this.linearTransformAroundCenter(
            scaleMatrix,
            this.center!,
            axis.modelMatrix
          )
          this.linearTransformAroundCenter(
            rotationAfterScale,
            this.center!,
            axis.modelMatrix
          )
        }
      }
    })
  }

  private getPointToCenterRay(point: Cesium.Cartesian3) {
    const centerToPoint = Cesium.Cartesian3.subtract(
      point,
      this.center!,
      new Cesium.Cartesian3()
    )
    return new Cesium.Ray(
      this.center!,
      Cesium.Cartesian3.normalize(centerToPoint, new Cesium.Cartesian3())
    )
  }

  private mouseDown({ position }: { position: Cesium.Cartesian2 }) {
    const objects = this.scene!.pick(position)
    const activeAxis = this.getActiveAxisFromMouse([objects])
    if (activeAxis) {
      this.activeAxis = activeAxis.activeAxis
      this.activeAxisType = activeAxis.activeAxisType
      this.updatePlane()
    }
  }
  private mouseUp() {
    const scene = this.scene!

    this.activeAxis = undefined

    scene.screenSpaceCameraController.enableRotate = true
    scene.screenSpaceCameraController.enableTranslate = true

    this.pointPrimitiveCollection!.removeAll()
    this.intersectStartPoint = undefined
    this.intersectEndPoint = undefined
  }
  private mouseMove({
    startPosition,
    endPosition
  }: {
    startPosition: Cesium.Cartesian2
    endPosition: Cesium.Cartesian2
  }) {
    const scene = this.scene!

    const objects = scene.pick(endPosition)

    const currentPointAxis = this.getActiveAxisFromMouse([objects])
    if (currentPointAxis || this.activeAxis) {
      document.body.style.cursor = 'move'
    } else {
      document.body.style.cursor = 'default'
    }
    if (!Cesium.defined(this.activeAxis)) return

    if (!Cesium.defined(this.plane)) {
      this.plane = this.createPlane()
    }

    const plane = this.plane

    if (!plane) return

    this.plane = plane

    const startRay = scene.camera.getPickRay(startPosition)
    const endRay = scene.camera.getPickRay(endPosition)

    if (!startRay || !endRay) return

    const startIntersection = Cesium.IntersectionTests.rayPlane(
      startRay,
      plane,
      new Cesium.Cartesian3()
    )
    const endIntersection = Cesium.IntersectionTests.rayPlane(
      endRay,
      plane,
      new Cesium.Cartesian3()
    )
    if (!Cesium.defined(startIntersection) || !Cesium.defined(endIntersection))
      return

    const modelMatrix = Cesium.Matrix4.IDENTITY.clone()

    const direction = this.gizmo!.directions[this.activeAxisType!]
    if (
      this.mode === ModeCollection.TRANSLATION ||
      this.mode === ModeCollection.SCALE
    ) {
      const offset = Cesium.Cartesian3.subtract(
        endIntersection,
        startIntersection,
        new Cesium.Cartesian3()
      )

      const distanceByDirection = Cesium.Cartesian3.dot(
        offset,
        direction.clone()
      )
      Cesium.Cartesian3.multiplyByScalar(direction, distanceByDirection, offset)

      if (this.mode === ModeCollection.TRANSLATION) {
        const translation = Cesium.Matrix4.fromTranslation(offset)
        this.updateTranslation(translation)
      }

      if (this.mode === ModeCollection.SCALE) {
        const distanceToCamera = Cesium.Cartesian3.distance(
          scene.camera.position,
          this.center!
        )
        const scaleElements = [1, 1, 1]
        scaleElements[this.activeAxisType!] =
          (distanceByDirection / distanceToCamera) * 5 + 1
        const scale = Cesium.Matrix4.fromScale(
          Cesium.Cartesian3.fromArray(scaleElements)
        )

        this.updateScale(scale)
      }
    }

    if (this.mode === ModeCollection.ROTATION) {
      const centerToStartIntersectionRay =
        this.getPointToCenterRay(startIntersection)
      const centerToEndIntersectionRay =
        this.getPointToCenterRay(endIntersection)

      const cross = Cesium.Cartesian3.cross(
        centerToStartIntersectionRay.direction,
        centerToEndIntersectionRay.direction,
        new Cesium.Cartesian3()
      )
      const number = Cesium.Cartesian3.dot(cross, plane.normal)
      const signal = number / (number ? Math.abs(number) : 1)
      const startPoint = Cesium.Ray.getPoint(
        centerToStartIntersectionRay,
        this.gizmo!.radius
      )
      const endPoint = Cesium.Ray.getPoint(
        centerToEndIntersectionRay,
        this.gizmo!.radius
      )
      const angle = Cesium.Cartesian3.angleBetween(
        centerToStartIntersectionRay.direction || startPoint,
        centerToEndIntersectionRay.direction || endPoint
      )
      if (!this.intersectStartPoint) {
        this.intersectStartPoint = this.pointPrimitiveCollection!.add({
          color: Cesium.Color.YELLOW,
          position: startPoint,
          pixelSize: 10,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        })
      }
      if (!this.intersectEndPoint) {
        this.intersectEndPoint = this.pointPrimitiveCollection!.add({
          color: Cesium.Color.YELLOW,
          position: endPoint,
          pixelSize: 10,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        })
      } else {
        this.intersectEndPoint.position = endPoint
      }
      const translationToCenter = Cesium.Matrix4.fromTranslation(
        this.cachedCenter!.clone()
      )
      const rotation = Cesium.Quaternion.fromAxisAngle(
        direction,
        angle * signal
      )
      const rotationMatrix = Cesium.Matrix4.fromRotationTranslation(
        Cesium.Matrix3.fromQuaternion(rotation)
      )
      const translationBack = Cesium.Matrix4.fromTranslation(
        Cesium.Cartesian3.negate(this.cachedCenter!, new Cesium.Cartesian3())
      )

      Cesium.Matrix4.multiply(modelMatrix, translationToCenter, modelMatrix)
      Cesium.Matrix4.multiply(modelMatrix, rotationMatrix, modelMatrix)
      Cesium.Matrix4.multiply(modelMatrix, translationBack, modelMatrix)

      this.updateRotation(rotationMatrix)
    }

    scene.screenSpaceCameraController.enableRotate = false
    scene.screenSpaceCameraController.enableTranslate = false
  }

  private registerHandler() {
    const handler = new Cesium.ScreenSpaceEventHandler(this.scene.canvas)

    handler.setInputAction(
      this.onMouseDown,
      Cesium.ScreenSpaceEventType.LEFT_DOWN
    )
    handler.setInputAction(this.onMouseUp, Cesium.ScreenSpaceEventType.LEFT_UP)
    handler.setInputAction(
      this.onMouseMove,
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    )

    this.handler = handler
  }

  public destory() {
    this.detoryHandler()
    this.gizmo?.destory()

    document.removeEventListener('keyup', this.keyEvent)
  }

  private detoryHandler() {
    if (this.handler) {
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN)
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP)
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)
      this.handler.destroy()
    }
  }
}
