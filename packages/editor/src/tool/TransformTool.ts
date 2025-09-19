import { IEvent, IPointData, IAlign, IAxis, IFunction, IMatrix, IUI } from '@leafer-ui/interface'
import { MathHelper, PointHelper, Matrix, LeafHelper, AroundHelper, isObject, isString, isNumber } from '@leafer-ui/draw'
import { DragEvent, RotateEvent, ZoomEvent, MoveEvent } from '@leafer-ui/core'

import { IEditBox, IEditPoint, IEditTool, IEditorScaleEvent, ISimulateElement, IEditorMoveEvent, IEditorRotateEvent, IEditorSkewEvent } from '@leafer-in/interface'

import { EditorMoveEvent } from '../event/EditorMoveEvent'
import { EditorScaleEvent } from '../event/EditorScaleEvent'
import { EditorRotateEvent } from '../event/EditorRotateEvent'
import { EditorSkewEvent } from '../event/EditorSkewEvent'

import { EditDataHelper } from '../helper/EditDataHelper'
import { ITransformTool } from '@leafer-ui/interface'


export class TransformTool implements ITransformTool { // Editor use

    public editBox: IEditBox

    public editTool?: IEditTool // 可能不存在值


    // operate

    public onMove(e: DragEvent | MoveEvent): void {

        const { target, mergeConfig, dragStartData } = this.editBox

        let move: IPointData, { dragLimitAnimate } = mergeConfig

        const isMoveEnd = e.type === MoveEvent.END || e.type === DragEvent.END
        const axisDrag = isString(target.draggable)
        const checkLimitMove = !dragLimitAnimate || isMoveEnd || axisDrag

        const total = { x: e.totalX, y: e.totalY }

        if (e instanceof MoveEvent) {
            PointHelper.move(total, target.getWorldPointByLocal(dragStartData.totalOffset, null, true))
        }

        if (e.shiftKey) {
            if (Math.abs(total.x) > Math.abs(total.y)) total.y = 0
            else total.x = 0
        }

        move = DragEvent.getValidMove(target, dragStartData.point, total, checkLimitMove)

        if (move.x || move.y) {
            if (dragLimitAnimate && !axisDrag && isMoveEnd) LeafHelper.animateMove(this as unknown as IUI, move, isNumber(dragLimitAnimate) ? dragLimitAnimate : 0.3)  // 是否进行动画
            else this.move(move)
        }
    }

    public onScale(e: DragEvent | ZoomEvent): void {

        const { target, mergeConfig, single, dragStartData } = this.editBox
        let { around, lockRatio, flipable, editSize } = mergeConfig, totalMove: IPointData | number

        if (e instanceof ZoomEvent) {
            around = target.getBoxPoint(e)
            totalMove = e.totalScale
        } else {
            totalMove = e.getInnerTotal(target)
        }

        const { direction } = e.current as IEditPoint
        if (e.shiftKey || target.lockRatio) lockRatio = true

        const data = EditDataHelper.getScaleData(target, dragStartData.bounds, direction, totalMove, lockRatio, EditDataHelper.getAround(around, e.altKey), flipable, !single || editSize === 'scale')

        const targetX = target.x, targetY = target.y

        if (e instanceof DragEvent && this.editTool && this.editTool.onScaleWithDrag) {
            data.drag = e
            this.scaleWithDrag(data)
        } else {
            this.scaleOf(data.origin, data.scaleX, data.scaleY)
        }

        PointHelper.move(dragStartData.totalOffset, target.x - targetX, target.y - targetY)
    }

    public onRotate(e: DragEvent | RotateEvent): void {

        const { target, mergeConfig, dragStartData } = this.editBox
        const { around, rotateAround, rotateGap } = mergeConfig
        const { direction } = e.current as IEditPoint

        let origin: IPointData, rotation: number

        if (e instanceof RotateEvent) {

            rotation = e.rotation
            origin = rotateAround ? AroundHelper.getPoint(rotateAround, target.boxBounds) : target.getBoxPoint(e)

        } else {

            const data = EditDataHelper.getRotateData(target, direction, e, dragStartData, e.shiftKey ? null : (rotateAround || target.around || target.origin || around || 'center'))
            rotation = dragStartData.rotation + data.rotation - target.rotation
            origin = data.origin

        }

        rotation = MathHelper.float(MathHelper.getGapRotation(rotation, rotateGap, target.rotation), 2)
        if (!rotation) return

        const targetX = target.x, targetY = target.y

        this.rotateOf(origin, rotation)

        PointHelper.move(dragStartData.totalOffset, target.x - targetX, target.y - targetY)
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
        if (isObject(x)) y = x.y, x = x.x

        const { target, mergeConfig, single, editor } = this.editBox
        const { beforeMove } = mergeConfig
        if (beforeMove) {
            const check = beforeMove({ target, x, y })
            if (isObject(check)) x = check.x, y = check.y
            else if (check === false) return
        }

        const world = target.getWorldPointByLocal({ x, y }, null, true)
        if (!single) (target as ISimulateElement).safeChange(() => target.move(x, y))
        const data: IEditorMoveEvent = { target, editor, moveX: world.x, moveY: world.y }

        this.emitEvent(new EditorMoveEvent(EditorMoveEvent.BEFORE_MOVE, data))
        const event = new EditorMoveEvent(EditorMoveEvent.MOVE, data)
        this.doMove(event)
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
            if (isObject(check)) scaleX = check.scaleX, scaleY = check.scaleY
            else if (check === false) return
        }

        const worldOrigin = this.getWorldOrigin(origin)
        const transform = !single && this.getChangedTransform(() => (target as ISimulateElement).safeChange(() => target.scaleOf(origin, scaleX, scaleY)))
        const data: IEditorScaleEvent = { target, editor, worldOrigin, scaleX, scaleY, transform }

        this.emitEvent(new EditorScaleEvent(EditorScaleEvent.BEFORE_SCALE, data))
        const event = new EditorScaleEvent(EditorScaleEvent.SCALE, data)
        this.doScale(event)
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
        this.doScale(event)
        this.emitEvent(event)
    }

    public rotateOf(origin: IPointData | IAlign, rotation: number): void {
        if (!this.checkTransform('rotateable')) return

        const { target, mergeConfig, single, editor } = this.editBox

        const { beforeRotate } = mergeConfig
        if (beforeRotate) {
            const check = beforeRotate({ target, origin, rotation })
            if (isNumber(check)) rotation = check
            else if (check === false) return
        }

        const worldOrigin = this.getWorldOrigin(origin)
        const transform = !single && this.getChangedTransform(() => (target as ISimulateElement).safeChange(() => target.rotateOf(origin, rotation)))
        const data: IEditorRotateEvent = { target, editor, worldOrigin, rotation, transform }

        this.emitEvent(new EditorRotateEvent(EditorRotateEvent.BEFORE_ROTATE, data))
        const event = new EditorRotateEvent(EditorRotateEvent.ROTATE, data)
        this.doRotate(event)
        this.emitEvent(event)
    }

    public skewOf(origin: IPointData | IAlign, skewX: number, skewY = 0, _resize?: boolean): void {
        if (!this.checkTransform('skewable')) return

        const { target, mergeConfig, single, editor } = this.editBox

        const { beforeSkew } = mergeConfig
        if (beforeSkew) {
            const check = beforeSkew({ target, origin, skewX, skewY })
            if (isObject(check)) skewX = check.skewX, skewY = check.skewY
            else if (check === false) return
        }

        const worldOrigin = this.getWorldOrigin(origin)
        const transform = !single && this.getChangedTransform(() => (target as ISimulateElement).safeChange(() => target.skewOf(origin, skewX, skewY)))
        const data: IEditorSkewEvent = { target, editor, worldOrigin, skewX, skewY, transform }

        this.emitEvent(new EditorSkewEvent(EditorSkewEvent.BEFORE_SKEW, data))
        const event = new EditorSkewEvent(EditorSkewEvent.SKEW, data)
        this.doSkew(event)
        this.emitEvent(event)
    }


    // do

    protected doMove(event: IEditorMoveEvent) {
        this.editTool.onMove(event)
    }

    protected doScale(event: IEditorScaleEvent): void {
        this.editTool.onScale(event)
    }

    protected doRotate(event: IEditorRotateEvent): void {
        this.editTool.onRotate(event)
    }

    protected doSkew(event: IEditorSkewEvent): void {
        this.editTool.onSkew(event)
    }

    // helper

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

    // need rewrite
    public emitEvent(event?: IEvent, capture?: boolean): void {
        this.editBox.editor.emitEvent(event, capture)
    }

}