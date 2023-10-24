import { IGroupInputData, IPolygon, IUI, IEventListenerId } from '@leafer-ui/interface'
import { IEditor, IEditorConfig, IEditorTool } from '@leafer-in/interface'

import { Group, Rect, Polygon, DragEvent, PointHelper, PointerEvent, RotateEvent, DataHelper, MathHelper, Bounds } from '@leafer-ui/core'

import { EditorResizeEvent } from './event/EditorResizeEvent'
import { EditorRotateEvent } from './event/EditorRotateEvent'

import { config } from './config'
import { getTool } from './tool'

import { create } from './editor/create'
import { onTarget } from './editor/target'
import { getResizeData } from './editor/resize'


export class Editor extends Group implements IEditor {

    public config = config

    // target

    public get target(): IUI | IUI[] { return this._target }
    public set target(value: IUI | IUI[]) {
        this._target = value, this.list = value ? (value instanceof Array ? value : [value]) : []
        onTarget(this)
    }
    private _target: IUI | IUI[]
    public list: IUI[]
    public simulateTarget: IUI = new Rect()

    // draw

    public box: IUI = new Rect({ hitFill: 'all', hitRadius: 5 }) // target rect
    public rect: IPolygon = new Polygon({ hittable: false, strokeAlign: 'center', strokeWidth: 2 }) // target stroke, no scale

    public circle: IUI = new Rect({ around: 'center', hitRadius: 10 }) // rotate point

    public resizePoints: IUI[] = [] // topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left
    public rotatePoints: IUI[] = [] // topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left
    public resizeLines: IUI[] = [] // top, right, bottom, left


    public tool: IEditorTool
    public enterPoint: IUI

    public __targetEventIds: IEventListenerId[] = []
    protected __eventIds: IEventListenerId[] = []

    constructor(userConfig?: IEditorConfig, data?: IGroupInputData) {
        super(data)
        if (userConfig) this.config = DataHelper.default(userConfig, this.config)
        create(this)
        this.__listenEvents()
    }

    public getTool(value: IUI | IUI[]): IEditorTool {
        return getTool(value)
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
        const { list } = this

        const each = (item: IUI) => {
            const local = e.getLocalMove(item)
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
        const { list, box, simulateTarget } = this
        const { x, y, width, height } = box.boxBounds
        const { rotateGap } = this.config

        const worldOrigin = box.getWorldPoint({ x: x + width / 2, y: y + height / 2 })

        let rotation: number
        if (e instanceof RotateEvent) {
            rotation = e.rotation
        } else {
            const point = e
            const last = { x: point.x - e.moveX, y: point.y - e.moveY }
            rotation = PointHelper.getChangeAngle(last, worldOrigin, point)
        }

        rotation = MathHelper.getGapRotation(simulateTarget.rotation + rotation, rotateGap) - simulateTarget.rotation

        if (!rotation) return

        const each = (item: IUI) => {
            const origin = item.getInnerPoint(worldOrigin)
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
            const old = item.boxBounds
            const origin = item.getInnerPoint(worldOrigin)
            const bounds = new Bounds(old).scaleOf(origin, data.scaleX, data.scaleY)

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

    public destroy(): void {
        this.__removeListenEvents()
        this.target = null
        super.destroy()
    }

}