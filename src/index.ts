import * as Cesium from 'cesium'
import TranslationAxis from './translationAxis'
import RotationAxis from './rotationAxis'
import { AxisType } from './baseAxis'
import { ModeCollection } from './type'
import translation from '../assets/translation.png'
import rotation from '../assets/rotation.png'
import scale from '../assets/scale.png'
import scale1 from '../assets/scale_1.png'

interface Options {
  scene: Cesium.Scene

  element: Cesium.Primitive

  boundingSphere: Cesium.BoundingSphere
}

interface PickObjectInterface {
  primitive: Cesium.Primitive

  id: AxisType
}

export default class Transformer {
  public scene: Cesium.Scene

  public element: Cesium.Primitive

  private boundingSphere: Cesium.BoundingSphere

  private elementCachedRotationMatrix: Cesium.Matrix4 =
    Cesium.Matrix4.IDENTITY.clone()

  private cachedCenter: Cesium.Cartesian3 | undefined
  private center: Cesium.Cartesian3 | undefined
  private handler: Cesium.ScreenSpaceEventHandler | undefined
  private activeAxis: Cesium.Primitive | undefined
  private activeAxisType: AxisType | undefined

  private gizmo: TranslationAxis | RotationAxis | undefined
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

  constructor({ scene, element, boundingSphere }: Options) {
    if (!scene) throw new Error('scene is required')

    this.scene = scene

    this.element = element
    this.boundingSphere = boundingSphere.clone()

    this.onMouseDown = this.mouseDown.bind(this)
    this.onMouseUp = this.mouseUp.bind(this)
    this.onMouseMove = this.mouseMove.bind(this)

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
    this.center = this.boundingSphere.center.clone()
    this.cachedCenter = this.center.clone()

    this.changeMode(ModeCollection.TRANSLATION)

    document.addEventListener('keyup', (e) => {
      if (e.key === 'w') {
        this.changeMode(ModeCollection.TRANSLATION)
      }
      if (e.key === 'e') {
        this.changeMode(ModeCollection.ROTATION)
      }
      if (e.key === 'r') {
        this.changeMode(ModeCollection.SCALE)
      }
    })

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

    this.getElementRotationMatrix()
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
      this.gizmo = new TranslationAxis({
        scene: this.scene,
        boundingSphere: this.boundingSphere
      })
    }
  }

  private getElementRotationMatrix() {
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
    // if (this.mode !== ModeCollection.ROTATION) return
    if (this.mode === ModeCollection.ROTATION) {
      const direction = this.gizmo.directions[this.activeAxisType!].clone()
      Cesium.Matrix4.multiplyByPointAsVector(
        this.gizmo.axises[0].modelMatrix,
        direction,
        direction
      )

      this.plane = Cesium.Plane.fromPointNormal(
        this.center,
        Cesium.Cartesian3.normalize(direction, new Cesium.Cartesian3())
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
        axisArray.includes(Number(axis.id))
      ) {
        return {
          activeAxis: axis.primitive,
          activeAxisType: Number(axis.id)
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

  private rotateAroundCenter(
    rotationMatrix: Cesium.Matrix4,
    center: Cesium.Cartesian3,
    result: Cesium.Matrix4
  ) {
    const translationToCenter = Cesium.Matrix4.fromTranslation(center.clone())
    const translationBack = Cesium.Matrix4.fromTranslation(
      Cesium.Cartesian3.negate(center, new Cesium.Cartesian3())
    )

    Cesium.Matrix4.multiply(result, translationToCenter, result)
    Cesium.Matrix4.multiply(result, rotationMatrix, result)
    Cesium.Matrix4.multiply(result, translationBack, result)

    return result
  }

  private scaleAroundCenter(
    scaleMatrix: Cesium.Matrix4,
    center: Cesium.Cartesian3,
    result: Cesium.Matrix4
  ) {
    const translationToCenter = Cesium.Matrix4.fromTranslation(center.clone())
    const translationBack = Cesium.Matrix4.fromTranslation(
      Cesium.Cartesian3.negate(center, new Cesium.Cartesian3())
    )

    Cesium.Matrix4.multiply(result, translationToCenter, result)
    Cesium.Matrix4.multiply(result, scaleMatrix, result)
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

    const elementRotationMatrix = Cesium.Matrix4.getRotation(
      this.element.modelMatrix,
      new Cesium.Matrix3()
    )
    const elementRotationMatrixInverse = Cesium.Matrix3.inverse(
      elementRotationMatrix,
      new Cesium.Matrix3()
    )
    Cesium.Matrix4.multiplyByMatrix3(
      this.element.modelMatrix,
      elementRotationMatrixInverse,
      this.element.modelMatrix
    )
    Cesium.Matrix4.multiply(
      this.element.modelMatrix,
      modelMatrix,
      this.element.modelMatrix
    )
    Cesium.Matrix4.multiplyByMatrix3(
      this.element.modelMatrix,
      elementRotationMatrix,
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
    this.rotateAroundCenter(
      cacheRotationInverse,
      this.cachedCenter!,
      this.element.modelMatrix
    )
    this.rotateAroundCenter(
      rotationMatrix,
      this.cachedCenter!,
      this.element.modelMatrix
    )
    this.rotateAroundCenter(
      this.elementCachedRotationMatrix,
      this.cachedCenter!,
      this.element.modelMatrix
    )

    this.gizmo?.axises.forEach((axis) => {
      this.rotateAroundCenter(rotationMatrix, this.center!, axis.modelMatrix)
    })
  }

  private updateScale(scaleMatrix: Cesium.Matrix4) {
    // Cesium.Matrix4.multiply(
    //   this.element.modelMatrix,
    //   scaleMatrix,
    //   this.element.modelMatrix
    // )
    this.scaleAroundCenter(
      scaleMatrix,
      this.cachedCenter!,
      this.element.modelMatrix
    )
    this.gizmo?.axises.forEach((axis) => {
      this.scaleAroundCenter(scaleMatrix, this.center!, axis.modelMatrix)
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
        const scale = Cesium.Matrix4.fromScale(
          new Cesium.Cartesian3(
            (distanceByDirection / distanceToCamera) * 10 + 1,
            (distanceByDirection / distanceToCamera) * 10 + 1,
            (distanceByDirection / distanceToCamera) * 10 + 1
          )
          // Cesium.Cartesian3.multiplyByScalar(
          //   direction,
          //   (distanceByDirection / distanceToCamera) * 10 + 1,
          //   new Cesium.Cartesian3()
          // )
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
          pixelSize: 10
        })
      }
      if (!this.intersectEndPoint) {
        this.intersectEndPoint = this.pointPrimitiveCollection!.add({
          color: Cesium.Color.YELLOW,
          position: endPoint,
          pixelSize: 10
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
