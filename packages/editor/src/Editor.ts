import { IGroupInputData, IPolygon, IUI, IEventListenerId, IPointData } from '@leafer-ui/interface'
import { IEditor, IEditorConfig, IEditorTool, IDirection8 } from '@leafer-in/interface'

import { Group, Rect, Polygon, DragEvent, PointHelper, PointerEvent, KeyEvent, RotateEvent, DataHelper, MathHelper, RenderEvent, Bounds } from '@leafer-ui/core'

import { getResizeData } from './resize'
import { updateCursor } from './cursor'

import { LineTool } from './tool/LineTool'
import { RectTool } from './tool/RectTool'

import { EditorResizeEvent } from './event/EditorResizeEvent'
import { EditorRotateEvent } from './event/EditorRotateEvent'
import { simulateTarget } from './simulate'
import { create } from './create'
import { config } from './config'


export class Editor extends Group implements IEditor {

    public config: IEditorConfig = config

    public get target(): IUI | IUI[] { return this._target }
    public set target(value: IUI | IUI[]) {
        this._target = value, this.list = value ? (value instanceof Array ? value : [value]) : []
        this.onTarget(value)
    }
    private _target: IUI | IUI[]
    public list: IUI[]

    public simulateTarget: IUI = new Rect()

    public box: IUI = new Rect({ hitFill: 'all', hitRadius: 5 }) // target rect
    public rect: IPolygon = new Polygon({ hittable: false, strokeAlign: 'center', strokeWidth: 2 }) // target stroke

    public circle: IUI = new Rect({ around: 'center', hitRadius: 10 }) // rotate point

    public resizePoints: IUI[] = [] // topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left
    public rotatePoints: IUI[] = [] // topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left
    public resizeLines: IUI[] = [] // top, right, bottom, left

    public tool: IEditorTool

    public enterPoint: IUI

    protected __eventIds: IEventListenerId[] = []
    protected __targetEventIds: IEventListenerId[] = []

    constructor(userConfig?: IEditorConfig, data?: IGroupInputData) {
        super(data)
        if (userConfig) this.config = DataHelper.default(userConfig, this.config)
        create(this)
        this.__listenEvents()
    }

    protected onTarget(value: IUI | IUI[]): void {
        this.__removeTargetEvents()
        this.visible = !!value
        this.simulateTarget.parent = null

        if (value) {
            this.waitLeafer(() => {
                this.tool = this.getTool(this.target)
                simulateTarget(this)

                this.update()
                this.updateMoveCursor()
                this.__listenTargetEvents()
            })
        }
    }

    public getTool(value: IUI | IUI[]): IEditorTool {
        return value instanceof Array || !(value.tag === 'Line' && value.resizeable) ? RectTool : LineTool
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
        let local: IPointData
        const { list } = this

        const each = (item: IUI) => {
            local = e.getLocalMove(item)
            if (e.shiftKey) {
                if (Math.abs(local.x) > Math.abs(local.y)) {
                    item.x += local.x
                } else {
                    item.y += local.y
                }
            } else {
                item.x += local.x
                item.y += local.y
            }
        }

        list.forEach(each)
        each(this.simulateTarget)
    }

    protected onRotate(e: DragEvent | RotateEvent): void {
        const { list } = this
        const { rotateGap } = this.config
        const { x, y, width, height } = this.box.boxBounds
        const worldOrigin = this.box.getWorldPoint({ x: x + width / 2, y: y + height / 2 })

        const each = (item: IUI) => {
            let rotation: number
            const origin = item.getInnerPoint(worldOrigin)

            if (e instanceof RotateEvent) {
                rotation = e.rotation
            } else {
                const point = e
                const last = { x: point.x - e.moveX, y: point.y - e.moveY }
                rotation = PointHelper.getChangeAngle(last, item.getWorldPoint(origin), point)
            }

            rotation = MathHelper.getGapRotation(item.rotation + rotation, rotateGap) - item.rotation

            const event = new EditorRotateEvent(EditorRotateEvent.ROTATE, { editor: this, target: item, origin, rotation })

            this.tool.rotate(event)
            item.emitEvent(event)
        }

        list.forEach(each)
        each(this.simulateTarget)
    }

    public onResize(e: DragEvent): void {
        const { list, box } = this
        const { __direction } = e.current.__

        let { resizeType, around, lockRatio } = this.config

        if (e.shiftKey) lockRatio = true
        if (e.altKey && !around) around = 'center'

        const data = getResizeData(box.boxBounds, __direction, e.getInnerMove(box), lockRatio, around)
        const worldOrigin = box.getWorldPoint(data.origin)

        const each = (item: IUI) => {
            const origin = item.getInnerPoint(worldOrigin)
            const old = item.boxBounds

            const bounds = new Bounds(old)
            bounds.scaleOf(origin, data.scaleX, data.scaleY)

            if (resizeType === 'auto') resizeType = item.resizeable ? 'size' : 'scale'
            const event = new EditorResizeEvent(EditorResizeEvent.RESIZE, { ...data, old, bounds, target: item, editor: this, dragEvent: e, resizeType })

            this.tool.resize(event)
            item.emitEvent(event)
        }

        list.forEach(each)
        each(this.simulateTarget)
    }


    public updateMoveCursor(): void {
        this.box.cursor = this.config.moveCursor
    }


    protected __listenEvents(): void {
        const { box } = this
        this.__eventIds = [
            box.on_(DragEvent.START, () => { this.opacity = this.config.hideOnMove ? 0 : 1 }),
            box.on_(DragEvent.DRAG, this.onMove, this),
            box.on_(DragEvent.END, () => { this.opacity = 1 }),
            box.on_(PointerEvent.ENTER, this.updateMoveCursor, this)
        ]
    }

    protected __removeListenEvents(): void {
        this.box.off_(this.__eventIds)
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
            const { leafer } = this.list[0]
            this.__targetEventIds = [
                leafer.on_(RenderEvent.START, this.update, this),
                leafer.on_([KeyEvent.HOLD, KeyEvent.UP], (e) => { updateCursor(this, e) })
            ]
        }
    }

    protected __removeTargetEvents(): void {
        if (this.__targetEventIds.length) {
            const { leafer } = this.list[0]
            if (leafer) leafer.off_(this.__targetEventIds)
            this.__targetEventIds.length = 0
        }
    }


    public destroy(): void {
        this.__removeListenEvents()
        this.list = null
        super.destroy()
    }

}