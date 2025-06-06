import { IEvent, IPointData, IAlign, IAxis, IFunction, IMatrix } from '@leafer-ui/interface'
import { MathHelper, Matrix, LeafHelper } from '@leafer-ui/draw'
import { DragEvent, RotateEvent, ZoomEvent, MoveEvent } from '@leafer-ui/core'

import { IEditBox, IEditPoint, IEditTool, IEditorScaleEvent, ISimulateElement, IEditorMoveEvent, IEditorRotateEvent, IEditorSkewEvent } from '@leafer-in/interface'

import { EditorMoveEvent } from '../event/EditorMoveEvent'
import { EditorScaleEvent } from '../event/EditorScaleEvent'
import { EditorRotateEvent } from '../event/EditorRotateEvent'
import { EditorSkewEvent } from '../event/EditorSkewEvent'

import { EditDataHelper } from '../helper/EditDataHelper'
import { ITransformTool } from '@leafer-ui/interface'

export class TransformTool implements ITransformTool {

    public editBox: IEditBox

    public editTool: IEditTool

    // operate

    public onMove(e: DragEvent | MoveEvent): void {

        const { target, mergeConfig } = this.editBox

        if (e instanceof MoveEvent) {

            if (e.moveType !== 'drag') {
                const { moveable, resizeable } = mergeConfig
                const move = e.getLocalMove(target)
                if (moveable === 'move') e.stop(), this.move(move.x, move.y)
                else if (resizeable === 'zoom') e.stop()
            }

        } else {

            const total = { x: e.totalX, y: e.totalY }

            if (e.shiftKey) {
                if (Math.abs(total.x) > Math.abs(total.y)) total.y = 0
                else total.x = 0
            }

            this.move(DragEvent.getValidMove(target, this.editBox.dragStartData.point, total))

        }
    }

    public onScale(e: DragEvent | ZoomEvent): void {

        const { target, mergeConfig, single } = this.editBox

        let { around, lockRatio, resizeable, flipable, editSize } = mergeConfig

        if (e instanceof ZoomEvent) {

            if (resizeable === 'zoom') e.stop(), this.scaleOf(target.getBoxPoint(e), e.scale, e.scale)

        } else {

            const { direction } = e.current as IEditPoint

            if (e.shiftKey || target.lockRatio) lockRatio = true

            const data = EditDataHelper.getScaleData(target, this.editBox.dragStartData.bounds, direction, e.getInnerTotal(target), lockRatio, EditDataHelper.getAround(around, e.altKey), flipable, !single || editSize === 'scale')

            if (this.editTool.onScaleWithDrag) {
                data.drag = e
                this.scaleWithDrag(data)
            } else {
                this.scaleOf(data.origin, data.scaleX, data.scaleY)
            }

        }
    }

    public onRotate(e: DragEvent | RotateEvent): void {

        const { target, mergeConfig } = this.editBox

        const { skewable, rotateable, around, rotateGap } = mergeConfig
        const { direction, name } = e.current as IEditPoint
        if (skewable && name === 'resize-line') return this.onSkew(e as DragEvent)

        const { dragStartData } = this.editBox
        let origin: IPointData, rotation: number

        if (e instanceof RotateEvent) {

            if (rotateable === 'rotate') e.stop(), rotation = e.rotation, origin = target.getBoxPoint(e)
            else return

            if (target.scaleX * target.scaleY < 0) rotation = -rotation // flippedOne

        } else {

            const data = EditDataHelper.getRotateData(target.boxBounds, direction, e.getBoxPoint(target), target.getBoxPoint(dragStartData), e.shiftKey ? null : (target.around || target.origin || around || 'center'))
            rotation = data.rotation
            origin = data.origin

        }

        if (target.scaleX * target.scaleY < 0) rotation = -rotation // flippedOne
        if (e instanceof DragEvent) rotation = dragStartData.rotation + rotation - target.rotation

        rotation = MathHelper.float(MathHelper.getGapRotation(rotation, rotateGap, target.rotation), 2)
        if (!rotation) return

        this.rotateOf(origin, rotation)
    }

    public onSkew(e: DragEvent): void {

        const { target, mergeConfig } = this.editBox

        const { around } = mergeConfig

        const { origin, skewX, skewY } = EditDataHelper.getSkewData(target.boxBounds, (e.current as IEditPoint).direction, e.getInnerMove(target), EditDataHelper.getAround(around, e.altKey))
        if (!skewX && !skewY) return

        this.skewOf(origin, skewX, skewY)
    }


    // transform

    public move(x: number | IPointData, y = 0): void {
        if (!this.checkTransform('moveable')) return
        if (typeof x === 'object') y = x.y, x = x.x

        const { target, mergeConfig, single, editor } = this.editBox
        const { beforeMove } = mergeConfig
        if (beforeMove) {
            const check = beforeMove({ target, x, y })
            if (typeof check === 'object') x = check.x, y = check.y
            else if (check === false) return
        }

        const world = target.getWorldPointByLocal({ x, y }, null, true)
        if (!single) (target as ISimulateElement).safeChange(() => target.move(x, y))
        const data: IEditorMoveEvent = { target, editor, moveX: world.x, moveY: world.y }

        this.emitEvent(new EditorMoveEvent(EditorMoveEvent.BEFORE_MOVE, data))
        const event = new EditorMoveEvent(EditorMoveEvent.MOVE, data)
        this.editTool.onMove(event)
        this.emitEvent(event)
    }

    public scaleWithDrag(data: IEditorScaleEvent): void {
        if (!this.checkTransform('resizeable')) return

        const { target, mergeConfig, editor } = this.editBox
        const { beforeScale } = mergeConfig
        if (beforeScale) {
            const { origin, scaleX, scaleY, drag } = data
            const check = beforeScale({ target, drag, origin, scaleX, scaleY })
            if (check === false) return
        }

        data = { ...data, target, editor, worldOrigin: target.getWorldPoint(data.origin) }

        this.emitEvent(new EditorScaleEvent(EditorScaleEvent.BEFORE_SCALE, data))
        const event = new EditorScaleEvent(EditorScaleEvent.SCALE, data)
        this.editTool.onScaleWithDrag(event)
        this.emitEvent(event)
    }

    public scaleOf(origin: IPointData | IAlign, scaleX: number, scaleY = scaleX, _resize?: boolean): void {
        if (!this.checkTransform('resizeable')) return

        const { target, mergeConfig, single, editor } = this.editBox

        const { beforeScale } = mergeConfig
        if (beforeScale) {
            const check = beforeScale({ target, origin, scaleX, scaleY })
            if (typeof check === 'object') scaleX = check.scaleX, scaleY = check.scaleY
            else if (check === false) return
        }

        const worldOrigin = this.getWorldOrigin(origin)
        const transform = !single && this.getChangedTransform(() => (target as ISimulateElement).safeChange(() => target.scaleOf(origin, scaleX, scaleY)))
        const data: IEditorScaleEvent = { target, editor, worldOrigin, scaleX, scaleY, transform }

        this.emitEvent(new EditorScaleEvent(EditorScaleEvent.BEFORE_SCALE, data))
        const event = new EditorScaleEvent(EditorScaleEvent.SCALE, data)
        this.editTool.onScale(event)
        this.emitEvent(event)
    }

    public flip(axis: IAxis): void {
        if (!this.checkTransform('resizeable')) return

        const { target, single, editor } = this.editBox

        const worldOrigin = this.getWorldOrigin('center')
        const transform = !single ? this.getChangedTransform(() => (target as ISimulateElement).safeChange(() => target.flip(axis))) : new Matrix(LeafHelper.getFlipTransform(target, axis))
        const data: IEditorScaleEvent = { target, editor, worldOrigin, scaleX: axis === 'x' ? -1 : 1, scaleY: axis === 'y' ? -1 : 1, transform }

        this.emitEvent(new EditorScaleEvent(EditorScaleEvent.BEFORE_SCALE, data))
        const event = new EditorScaleEvent(EditorScaleEvent.SCALE, data)
        this.editTool.onScale(event)
        this.emitEvent(event)
    }

    public rotateOf(origin: IPointData | IAlign, rotation: number): void {
        if (!this.checkTransform('rotateable')) return

        const { target, mergeConfig, single, editor } = this.editBox

        const { beforeRotate } = mergeConfig
        if (beforeRotate) {
            const check = beforeRotate({ target, origin, rotation })
            if (typeof check === 'number') rotation = check
            else if (check === false) return
        }

        const worldOrigin = this.getWorldOrigin(origin)
        const transform = !single && this.getChangedTransform(() => (target as ISimulateElement).safeChange(() => target.rotateOf(origin, rotation)))
        const data: IEditorRotateEvent = { target, editor, worldOrigin, rotation, transform }

        this.emitEvent(new EditorRotateEvent(EditorRotateEvent.BEFORE_ROTATE, data))
        const event = new EditorRotateEvent(EditorRotateEvent.ROTATE, data)
        this.editTool.onRotate(event)
        this.emitEvent(event)
    }

    public skewOf(origin: IPointData | IAlign, skewX: number, skewY = 0, _resize?: boolean): void {
        if (!this.checkTransform('skewable')) return

        const { target, mergeConfig, single, editor } = this.editBox

        const { beforeSkew } = mergeConfig
        if (beforeSkew) {
            const check = beforeSkew({ target, origin, skewX, skewY })
            if (typeof check === 'object') skewX = check.skewX, skewY = check.skewY
            else if (check === false) return
        }

        const worldOrigin = this.getWorldOrigin(origin)
        const transform = !single && this.getChangedTransform(() => (target as ISimulateElement).safeChange(() => target.skewOf(origin, skewX, skewY)))
        const data: IEditorSkewEvent = { target, editor, worldOrigin, skewX, skewY, transform }

        this.emitEvent(new EditorSkewEvent(EditorSkewEvent.BEFORE_SKEW, data))
        const event = new EditorSkewEvent(EditorSkewEvent.SKEW, data)
        this.editTool.onSkew(event)
        this.emitEvent(event)
    }

    public checkTransform(type: 'moveable' | 'resizeable' | 'rotateable' | 'skewable'): boolean {
        const { target, mergeConfig } = this.editBox
        return target && !target.locked && mergeConfig[type] as boolean
    }

    protected getWorldOrigin(origin: IPointData | IAlign): IPointData {
        const { target } = this.editBox
        return target.getWorldPoint(LeafHelper.getInnerOrigin(target, origin))
    }

    protected getChangedTransform(func: IFunction): IMatrix {

        const { target, single } = this.editBox

        if (!single && !(target as ISimulateElement).canChange) return (target as ISimulateElement).changedTransform

        const oldMatrix = new Matrix(target.worldTransform)
        func()
        return new Matrix(target.worldTransform).divide(oldMatrix) // world change transform
    }

    public emitEvent(_event?: IEvent, _capture?: boolean): void { }

}