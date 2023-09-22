import { IGroupInputData, IPolygon, IUI, IEventListenerId } from '@leafer-ui/interface'
import { IEditor, IEditorConfig, IEditorTool, IDirection8 } from '@leafer-in/interface'

import { Group, Rect, Polygon, DragEvent, PointHelper, PointerEvent, KeyEvent, RotateEvent, DataHelper, MathHelper, RenderEvent } from '@leafer-ui/core'

import { getResizeData } from './resize'
import { updateCursor } from './cursor'

import { LineTool } from './tool/LineTool'
import { RectTool } from './tool/RectTool'

import { EditorResizeEvent } from './event/EditorResizeEvent'
import { EditorRotateEvent } from './event/EditorRotateEvent'


export class Editor extends Group implements IEditor {

    public config: IEditorConfig = {
        type: 'pc',
        stroke: '#836DFF',
        pointFill: '#FFFFFF',
        pointSize: 10,
        pointRadius: 10,
        rotateGap: 90,
        hideOnMove: false,
        moveCursor: 'move',
        resizeType: 'auto',
        resizeCursor: ['nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize'],
        rotateCursor: ['ne-resize', 'e-resize', 'se-resize', 's-resize', 'sw-resize', 'w-resize', 'nw-resize', 'n-resize'],
        resizeable: true,
        rotateable: true
    }

    public resizePoints: IUI[] = [] // topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left
    public rotatePoints: IUI[] = [] // topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left
    public resizeLines: IUI[] = [] // top, right, bottom, left

    public targetRect: IUI = new Rect({ hitFill: 'all', hitRadius: 5 })
    public rect: IPolygon = new Polygon({ hittable: false, strokeAlign: 'center' })
    public circle: IUI = new Rect({ around: 'center', hitRadius: 10 }) // rotate point

    public tool: IEditorTool

    private _target: IUI
    public get target(): IUI { return this._target }
    public set target(value: IUI) {
        this.__removeTargetEvents()
        this.visible = !!value

        this._target = value
        if (value) this.onTarget()
    }

    public enterPoint: IUI

    protected __eventIds: IEventListenerId[] = []
    protected __targetEventIds: IEventListenerId[] = []

    constructor(userConfig?: IEditorConfig, data?: IGroupInputData) {
        super(data)
        if (userConfig) this.config = DataHelper.default(userConfig, this.config)
        this.init()
    }

    protected init() {
        let rotatePoint: IUI, resizeLine: IUI, resizePoint: IUI
        const { resizePoints, rotatePoints, resizeLines } = this

        for (let i = 0; i < 8; i++) {
            rotatePoint = new Rect({ around: 'center', width: 30, height: 30, hitRadius: 10, hitFill: "all" })
            rotatePoints.push(rotatePoint)
            this.__listenPointEvents(rotatePoint, 'rotate', i)

            if (i % 2) {
                resizeLine = new Rect({ around: 'center', width: 10, height: 10, hitFill: "all" })
                resizeLines.push(resizeLine)
                this.__listenPointEvents(resizeLine, 'resize', i)
            }

            resizePoint = new Rect({ around: 'center', hitRadius: 5 })
            resizePoints.push(resizePoint)
            this.__listenPointEvents(resizePoint, 'resize', i)
        }

        this.__listenPointEvents(this.circle, 'rotate', 1)
        this.addMany(...rotatePoints, this.targetRect, this.rect, this.circle, ...resizeLines, ...resizePoints)

        this.__listenEvents()
    }


    protected onTarget(): void {
        this.tool = this.getTool(this.target)
        this.waitLeafer(() => {
            this.update()
            this.updateMoveCursor()
            this.__listenTargetEvents()
        })
    }

    public getTool(value: IUI): IEditorTool {
        return (value.tag === 'Line' && value.resizeable) ? LineTool : RectTool
    }

    public update(): void {
        if (!this.target) return
        this.tool.update(this)
    }


    protected onDrag(e: DragEvent): void {
        const { resizeable, rotateable } = this.config
        if (e.metaKey || e.ctrlKey || !resizeable) {
            if (rotateable) this.onRotate(e)
        } else {
            this.onResize(e)
        }
    }

    protected onMove(e: DragEvent): void {
        const { target } = this
        const { x, y } = e.getLocalMove(target)
        if (e.shiftKey) {
            if (Math.abs(x) > Math.abs(y)) {
                target.x += x
            } else {
                target.y += y
            }
        } else {
            target.x += x
            target.y += y
        }
    }

    protected onRotate(e: DragEvent | RotateEvent): void {
        const { target } = this
        const { rotateGap } = this.config
        const { x, y, width, height } = target.boxBounds
        const origin = { x: x + width / 2, y: y + height / 2 }

        let rotation: number

        if (e instanceof RotateEvent) {
            rotation = e.rotation
        } else {
            const point = e
            const last = { x: point.x - e.moveX, y: point.y - e.moveY }
            rotation = PointHelper.getChangeAngle(last, target.getWorldPoint(origin), point)
        }

        rotation = MathHelper.getGapRotation(target.rotation + rotation, rotateGap) - target.rotation

        const event = new EditorRotateEvent(EditorRotateEvent.ROTATE, { editor: this, target, origin, rotation })

        this.tool.rotate(event)
        target.emitEvent(event)
    }

    public onResize(e: DragEvent): void {
        const { target } = this
        const { __direction } = e.current.__

        let { resizeType, around, lockRatio } = this.config

        if (e.shiftKey) lockRatio = true
        if (e.altKey && !around) around = 'center'

        if (resizeType === 'auto') resizeType = target.resizeable ? 'size' : 'scale'
        const data = getResizeData(target.boxBounds, __direction, e.getInnerMove(this.targetRect), lockRatio, around)

        const event = new EditorResizeEvent(EditorResizeEvent.RESIZE, { ...data, target, editor: this, dragEvent: e, resizeType })

        this.tool.resize(event)
        target.emitEvent(event)
    }


    public updateMoveCursor(): void {
        this.targetRect.cursor = this.config.moveCursor
    }


    protected __listenEvents(): void {
        this.__eventIds = [
            this.targetRect.on_(DragEvent.START, () => { this.opacity = this.config.hideOnMove ? 0 : 1 }),
            this.targetRect.on_(DragEvent.DRAG, this.onMove, this),
            this.targetRect.on_(DragEvent.END, () => { this.opacity = 1 }),
            this.targetRect.on_(PointerEvent.ENTER, this.updateMoveCursor, this)
        ]
    }

    protected __removeListenEvents(): void {
        this.targetRect.off_(this.__eventIds)
        this.__eventIds.length = 0
    }


    protected __listenPointEvents(point: IUI, type: 'rotate' | 'resize', direction: IDirection8): void {
        point.__.__direction = direction
        const resize = point.__.__isResizePoint = type === 'resize'
        point.on_(DragEvent.DRAG, resize ? this.onDrag : this.onRotate, this) // i % 2 ? this.onSkew : 
        point.on_(PointerEvent.LEAVE, () => this.enterPoint = null)
        point.on_(PointerEvent.ENTER, (e) => { this.enterPoint = point; updateCursor(this, e) })
    }


    protected __listenTargetEvents(): void {
        if (this.target) {
            const { leafer } = this.target
            this.__targetEventIds = [
                leafer.on_(RenderEvent.START, this.update, this),
                leafer.on_([KeyEvent.HOLD, KeyEvent.UP], (e) => { updateCursor(this, e) })
            ]
        }
    }

    protected __removeTargetEvents(): void {
        if (this.__targetEventIds.length) {
            const { leafer } = this.target
            if (leafer) leafer.off_(this.__targetEventIds)
            this.__targetEventIds.length = 0
        }
    }


    public destroy(): void {
        this.__removeListenEvents()
        this._target = null
        super.destroy()
    }

}