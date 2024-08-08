import * as Cesium from 'cesium'
import TranslationAxis from './translationAxis'
import RotationAxis from './rotationAxis'
import { AxisType } from './baseAxis'
import { ModeCollection } from './type'
import translationImage from '../assets/translation.png'
import rotation from '../assets/rotation.png'
import scale from '../assets/scale.png'

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

  public boundingSphere: Cesium.BoundingSphere

  private center: Cesium.Cartesian3 | undefined
  private handler: Cesium.ScreenSpaceEventHandler | undefined
  private activeAxis: Cesium.Primitive | undefined
  private activeAxisType: AxisType | undefined

  private gizmo: TranslationAxis | RotationAxis | undefined
  private mode: ModeCollection = ModeCollection.TRANSLATION
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
    this.boundingSphere = boundingSphere

    this.onMouseDown = this.mouseDown.bind(this)
    this.onMouseUp = this.mouseUp.bind(this)
    this.onMouseMove = this.mouseMove.bind(this)

    this.init()
  }

  get isDetoryed() {
    return this.handler === undefined
  }

  init() {
    if (!this.element || !this.boundingSphere)
      throw new Error('element and boundingSphere are required')

    const pointPrimitiveCollection = new Cesium.PointPrimitiveCollection()
    this.scene.primitives.add(pointPrimitiveCollection)
    this.pointPrimitiveCollection = pointPrimitiveCollection
    this.center = this.boundingSphere.center.clone()

    this.changeMode(ModeCollection.ROTATION)

    // this.initGizmo()

    this.registerHandler()
  }
  initGizmo() {
    this.scene.primitives.add(this.gizmoModesBillboard)

    this.gizmoModesBillboard.add({
      position: this.center!,
      image: rotation,
      horizontalOrigin: Cesium.HorizontalOrigin.RIGHT,
      verticalOrigin: Cesium.VerticalOrigin.TOP
    })
    this.gizmoModesBillboard.add({
      position: this.center!,
      image: scale,
      horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM
    })
    this.gizmoModesBillboard.add({
      position: this.center!,
      image: translationImage,
      horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
      verticalOrigin: Cesium.VerticalOrigin.TOP
    })
  }
  changeMode(mode: ModeCollection) {
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
    const direction = this.gizmo.directions[this.activeAxisType!].clone()
    Cesium.Matrix4.multiplyByPoint(
      this.gizmo.axises[0].modelMatrix,
      direction,
      direction
    )

    this.plane = Cesium.Plane.fromPointNormal(
      this.center,
      Cesium.Cartesian3.normalize(direction, new Cesium.Cartesian3())
    )
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

  private updateTranslation(newMatrix: Cesium.Matrix4) {
    Cesium.Matrix4.multiply(
      this.element.modelMatrix,
      newMatrix,
      this.element.modelMatrix
    )

    // this.gizmo?.axises.forEach((axis) => {
    //   Cesium.Matrix4.multiply(axis.modelMatrix, newMatrix, axis.modelMatrix)
    // })
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

    const direction = this.gizmo!.directions[this.activeAxisType!]

    const modelMatrix = Cesium.Matrix4.IDENTITY.clone()

    if (this.mode === ModeCollection.TRANSLATION) {
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

      const translation = Cesium.Matrix4.fromTranslation(offset)

      Cesium.Matrix4.multiply(modelMatrix, translation, modelMatrix)
      this.updateTranslation(modelMatrix)
    }

    if (this.mode === ModeCollection.ROTATION) {
      const centerToStartIntersection = Cesium.Cartesian3.subtract(
        startIntersection,
        this.center!,
        new Cesium.Cartesian3()
      )
      const centerToEndIntersection = Cesium.Cartesian3.subtract(
        endIntersection,
        this.center!,
        new Cesium.Cartesian3()
      )
      const centerToStartIntersectionRay = new Cesium.Ray(
        this.center!,
        Cesium.Cartesian3.normalize(
          centerToStartIntersection,
          new Cesium.Cartesian3()
        )
      )
      const centerToEndIntersectionRay = new Cesium.Ray(
        this.center!,
        Cesium.Cartesian3.normalize(
          centerToEndIntersection,
          new Cesium.Cartesian3()
        )
      )
      const cross = Cesium.Cartesian3.cross(
        centerToStartIntersection,
        centerToEndIntersection,
        new Cesium.Cartesian3()
      )
      const number = Cesium.Cartesian3.dot(cross, direction)
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
        centerToStartIntersection || startPoint,
        centerToEndIntersection || endPoint
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
        this.center!.clone()
      )
      const rotation = Cesium.Quaternion.fromAxisAngle(
        direction,
        angle * signal
      )
      const rotationMatrix = Cesium.Matrix4.fromRotationTranslation(
        Cesium.Matrix3.fromQuaternion(rotation)
      )
      const translationBack = Cesium.Matrix4.fromTranslation(
        Cesium.Cartesian3.negate(this.center!, new Cesium.Cartesian3())
      )

      Cesium.Matrix4.multiply(modelMatrix, translationToCenter, modelMatrix)
      Cesium.Matrix4.multiply(modelMatrix, rotationMatrix, modelMatrix)
      Cesium.Matrix4.multiply(modelMatrix, translationBack, modelMatrix)
    }

    this.updateTranslation(modelMatrix)

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
