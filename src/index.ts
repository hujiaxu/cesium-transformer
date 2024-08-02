import * as Cesium from 'cesium'
import TranslationAxis, { AxisType } from './translationAxis'

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

  private translationAxis: TranslationAxis | undefined

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

    this.center = this.boundingSphere.center.clone()

    const translation = new TranslationAxis({
      scene: this.scene,
      center: this.center
    })

    this.translationAxis = translation
    this.registerHandler()
  }
  private createPlane() {
    if (!this.center) return

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

  private getActiveAxisFromMouse(axis: PickObjectInterface | undefined) {
    if (!axis) return undefined

    const axisArray = [AxisType.X, AxisType.Y, AxisType.Z]

    if (
      axis.primitive instanceof Cesium.Primitive &&
      axisArray.includes(Number(axis.id))
    ) {
      this.activeAxisType = Number(axis.id)
      return {
        activeAxis: axis.primitive,
        activeAxisType: Number(axis.id)
      }
    }
  }

  private updateTranslation(translation: Cesium.Matrix4) {
    Cesium.Matrix4.multiply(
      translation,
      this.element.modelMatrix,
      this.element.modelMatrix
    )

    this.translationAxis?.axises.forEach((axis) => {
      Cesium.Matrix4.multiply(translation, axis.modelMatrix, axis.modelMatrix)
    })
  }

  private mouseDown({ position }: { position: Cesium.Cartesian2 }) {
    const axis = this.scene!.pick(position)
    this.activeAxis = this.getActiveAxisFromMouse(axis)?.activeAxis
    this.activeAxisType = this.getActiveAxisFromMouse(axis)?.activeAxisType
  }
  private mouseUp() {
    const scene = this.scene!

    this.activeAxis = undefined

    scene.screenSpaceCameraController.enableRotate = true
    scene.screenSpaceCameraController.enableTranslate = true
  }
  private mouseMove({
    startPosition,
    endPosition
  }: {
    startPosition: Cesium.Cartesian2
    endPosition: Cesium.Cartesian2
  }) {
    const scene = this.scene!

    const axis = scene.pick(endPosition)

    const currentPointAxis = this.getActiveAxisFromMouse(axis)
    if (currentPointAxis || this.activeAxis) {
      document.body.style.cursor = 'move'
    } else {
      document.body.style.cursor = 'default'
    }
    if (!Cesium.defined(this.activeAxis)) return

    const plane = this.createPlane()

    if (!plane) return

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

    const offset = Cesium.Cartesian3.subtract(
      endIntersection,
      startIntersection,
      new Cesium.Cartesian3()
    )

    const direction = this.translationAxis!.directions[this.activeAxisType!]

    const distanceByDirection = Cesium.Cartesian3.dot(offset, direction.clone())

    Cesium.Cartesian3.multiplyByScalar(direction, distanceByDirection, offset)

    const translation = Cesium.Matrix4.fromTranslation(offset)

    this.updateTranslation(translation)

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
