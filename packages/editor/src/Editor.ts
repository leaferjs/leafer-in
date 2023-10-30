import { IGroupInputData, IUI, IEventListenerId, IPointData, ILeafList, ILeaferBase } from '@leafer-ui/interface'
import { Group, Rect, DragEvent, RotateEvent, DataHelper, MathHelper, Bounds, LeafList } from '@leafer-ui/core'

import { IEditBox, IEditPoint, IEditor, IEditorConfig, IEditorTool } from '@leafer-in/interface'

import { EditorMoveEvent } from './event/EditorMoveEvent'
import { EditorResizeEvent } from './event/EditorResizeEvent'
import { EditorRotateEvent } from './event/EditorRotateEvent'
import { EditorSkewEvent } from './event/EditorSkewEvent'

import { EditSelector } from './ui/EditSelector'
import { EditBox } from './ui/EditBox'

import { config } from './config'
import { getTool } from './tool'

import { onTarget } from './editor/target'
import { onHover } from './editor/hover'
import { getAround, getResizeData, getRotateData, getSkewData } from './editor/data'


export class Editor extends Group implements IEditor {

    public config = config

    // hover

    public get hoverTarget(): IUI { return this._hoverTarget }
    public set hoverTarget(value: IUI) { if (this._hoverTarget !== value) this._hoverTarget = value, onHover(this, value) }
    private _hoverTarget: IUI

    // target

    public get target(): IUI | IUI[] | ILeafList { return this._target }
    public set target(value: IUI | IUI[] | ILeafList) { if (this._target !== value) this._target = value, onTarget(this, value) }
    private _target: IUI | IUI[] | ILeafList


    public targetList: ILeafList = new LeafList() // from target
    public get multiple(): boolean { return this.targetList.length > 1 }


    public targetSimulate: IUI = new Rect({ visible: false })
    public targetLeafer: ILeaferBase


    public selector: EditSelector = new EditSelector(this)
    public box: IEditBox = new EditBox(this)


    public tool: IEditorTool

    public targetEventIds: IEventListenerId[] = []


    constructor(userConfig?: IEditorConfig, data?: IGroupInputData) {
        super(data)
        if (userConfig) this.config = DataHelper.default(userConfig, this.config)
        this.addMany(this.selector, this.box)
    }

    // item

    public hasItem(item: IUI): boolean {
        return this.targetList.has(item)
    }

    public shiftItem(item: IUI): void {
        this.hasItem(item) ? this.removeItem(item) : this.addItem(item)
    }

    public addItem(item: IUI): void {
        if (this.hasItem(item)) return
        this.targetList.push(item)
        this.target = this.targetList.list as IUI[]
    }

    public removeItem(item: IUI): void {
        if (this.hasItem(item)) {
            this.targetList.remove(item)
            this.target = this.targetList.list as IUI[]
        }
    }

    // update

    public getTool(value: IUI | IUI[]): IEditorTool {
        return getTool(value)
    }

    public update(): void {
        if (!this.target) return
        this.tool.update(this)
    }

    // operate

    public onMove(e: DragEvent): void {
        const list = this.targetList.list as IUI[]

        const events: EditorMoveEvent[] = []
        const each = (target: IUI) => {
            const move = e.getLocalMove(target)
            if (e.shiftKey) {
                if (Math.abs(move.x) > Math.abs(move.y)) {
                    move.y = 0
                } else {
                    move.x = 0
                }
            }
            events.push(new EditorMoveEvent(EditorMoveEvent.MOVE, { editor: this, target, moveX: move.x, moveY: move.y }))
        }

        list.forEach(each)
        if (this.multiple) each(this.targetSimulate)

        events.forEach(event => {
            this.tool.move(event)
            event.target.emitEvent(event)
        })
    }



    public onResize(e: DragEvent): void {
        const list = this.targetList.list as IUI[]
        const { targetRect } = this.box
        const { direction } = e.current as IEditPoint

        let { resizeType, around, lockRatio } = this.config

        if (e.shiftKey) lockRatio = true

        const resizeData = getResizeData(targetRect.boxBounds, direction, e.getInnerMove(targetRect), lockRatio, getAround(around, e.altKey))
        const worldOrigin = targetRect.getWorldPoint(resizeData.origin)

        const events: EditorResizeEvent[] = []
        const each = (target: IUI) => {
            const old = target.boxBounds
            const origin = target.getInnerPoint(worldOrigin)
            const bounds = new Bounds(old).scaleOf(origin, resizeData.scaleX, resizeData.scaleY)
            events.push(new EditorResizeEvent(EditorResizeEvent.RESIZE, { ...resizeData, old, bounds, target, editor: this, dragEvent: e, resizeType: resizeType === 'auto' ? (target.resizeable ? 'size' : 'scale') : resizeType }))
        }

        list.forEach(each)
        if (this.multiple) each(this.targetSimulate)

        events.forEach(event => {
            this.tool.resize(event)
            event.target.emitEvent(event)
        })
    }


    public onRotate(e: DragEvent | RotateEvent): void {
        const { skewable, around, rotateGap } = this.config
        const { direction } = e.current as IEditPoint
        if (skewable && direction % 2) return this.onSkew(e as DragEvent)

        const { targetRect } = this.box
        const list = this.targetList.list as IUI[]

        let worldOrigin: IPointData, rotation: number
        if (e instanceof RotateEvent) {
            rotation = e.rotation, worldOrigin = e
        } else {
            const last = { x: e.x - e.moveX, y: e.y - e.moveY }
            const data = getRotateData(targetRect.boxBounds, direction, e.getInner(targetRect), targetRect.getInnerPoint(last), e.shiftKey ? null : (around || 'center'))
            rotation = data.rotation, worldOrigin = targetRect.getWorldPoint(data.origin)
        }

        rotation = MathHelper.getGapRotation(this.rotation + rotation, rotateGap) - this.rotation
        if (!rotation) return

        const mirror = this.tool.getMirrorData(this)
        if (mirror.x + mirror.y === 1) rotation = -rotation

        const events: EditorRotateEvent[] = []
        const each = (target: IUI) => {
            const origin = target.getInnerPoint(worldOrigin)
            events.push(new EditorRotateEvent(EditorRotateEvent.ROTATE, { editor: this, target, origin, rotation }))
        }

        list.forEach(each)
        if (this.multiple) each(this.targetSimulate)

        events.forEach(event => {
            this.tool.rotate(event)
            event.target.emitEvent(event)
        })
    }

    public onSkew(e: DragEvent): void {
        const { targetSimulate } = this
        const list = this.targetList.list as IUI[]
        const find = this.multiple ? targetSimulate : list[0]
        const data = getSkewData(find.boxBounds, (e.current as IEditPoint).direction, e.getInnerMove(find), getAround(this.config.around, e.altKey))
        const { skewX, skewY } = data
        const worldOrigin = find.getWorldPoint(data.origin)

        const events: EditorSkewEvent[] = []
        const each = (target: IUI) => {
            const origin = target.getInnerPoint(worldOrigin)
            events.push(new EditorSkewEvent(EditorSkewEvent.SKEW, { editor: this, target, origin, skewX, skewY }))
        }

        list.forEach(each)
        if (this.multiple) each(this.targetSimulate)

        events.forEach(event => {
            this.tool.skew(event)
            event.target.emitEvent(event)
        })
    }


    public destroy(): void {
        if (!this.destroyed) {
            this.targetSimulate.destroy()
            this.target = this.hoverTarget = this.targetLeafer = this.targetSimulate = null
            super.destroy()
        }
    }

}