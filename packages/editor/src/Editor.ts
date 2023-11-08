import { IGroupInputData, IUI, IEventListenerId, IPointData, ILeafList, ILeaferBase } from '@leafer-ui/interface'
import { Group, Rect, DragEvent, RotateEvent, DataHelper, MathHelper, LeafList, Matrix } from '@leafer-ui/core'

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
import { EditPoint } from './ui/EditPoint'


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


    public get list(): IUI[] { return this.targetList.list as IUI[] }
    public targetList: ILeafList = new LeafList() // from target
    public get multiple(): boolean { return this.targetList.length > 1 }


    public targetSimulate: IUI = new Rect({ visible: false })
    public targetLeafer: ILeaferBase


    public selector: EditSelector = new EditSelector(this)
    public box: IEditBox = new EditBox(this)


    public tool: IEditorTool

    public targetEventIds: IEventListenerId[] = []

    public get rect() { return this.multiple ? this.targetSimulate : this.targetList.list[0] }
    public aroundPoint: IEditPoint = new EditPoint({ around: 'center', hitRadius: 10, width: 10, height: 10, fill: 'red' })


    constructor(userConfig?: IEditorConfig, data?: IGroupInputData) {
        super(data)
        if (userConfig) this.config = DataHelper.default(userConfig, this.config)
        this.addMany(this.selector, this.box)
        this.add(this.aroundPoint)
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
        this.targetList.add(item)
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
        const { list } = this

        const each = (target: IUI) => {
            const move = e.getLocalMove(target)
            if (e.shiftKey) {
                if (Math.abs(move.x) > Math.abs(move.y)) move.y = 0
                else move.x = 0
            }
            const event = new EditorMoveEvent(EditorMoveEvent.MOVE, {
                target,
                editor: this,
                moveX: move.x,
                moveY: move.y
            })
            this.tool.move(event)
            event.target.emitEvent(event)
        }

        list.forEach(each)
        if (this.multiple) each(this.targetSimulate)
    }



    public onResize(e: DragEvent): void {
        const { list, rect } = this
        const { direction } = e.current as IEditPoint

        let { resizeType, around, lockRatio } = this.config
        if (e.shiftKey) lockRatio = true

        const resizeData = getResizeData(rect.boxBounds, direction, e.getInnerMove(rect), lockRatio, getAround(around, e.altKey))
        const worldOrigin = rect.getWorldPoint(resizeData.targetOrigin)
        this.aroundPoint.set(worldOrigin)

        if (this.multiple) {

            const rect = this.targetSimulate
            const matrix = new Matrix(rect.localTransform)
            rect.scaleOf(rect.getInnerPoint(worldOrigin), resizeData.scaleX, resizeData.scaleY)
            matrix.divideParent(rect.localTransform)

            list.forEach(target => {
                target.transform(matrix)
            })

        } else {
            const each = (target: IUI) => {
                const event = new EditorResizeEvent(EditorResizeEvent.RESIZE, {
                    target,
                    editor: this,
                    dragEvent: e,
                    ...resizeData,
                    targetOrigin: target.getInnerPoint(worldOrigin),
                    resize: ((resizeType === 'auto' ? (target.resizeable ? 'size' : 'scale') : resizeType) === 'size')
                })
                this.tool.resize(event)
                event.target.emitEvent(event)
            }

            list.forEach(each)
        }
    }


    public onRotate(e: DragEvent | RotateEvent): void {
        const { skewable, around, rotateGap } = this.config
        const { direction } = e.current as IEditPoint
        if (skewable && direction % 2) return this.onSkew(e as DragEvent)

        const { list, rect } = this

        let worldOrigin: IPointData, rotation: number
        if (e instanceof RotateEvent) {
            rotation = e.rotation, worldOrigin = e
        } else {
            const last = { x: e.x - e.moveX, y: e.y - e.moveY }
            const rotateData = getRotateData(rect.boxBounds, direction, e.getInner(rect), rect.getInnerPoint(last), e.shiftKey ? null : (around || 'center'))
            rotation = rotateData.rotation, worldOrigin = rect.getWorldPoint(rotateData.targetOrigin)
        }

        rotation = MathHelper.getGapRotation(rotation, rotateGap, rect.rotation)
        if (!rotation) return

        const mirror = this.tool.getMirrorData(this)
        if (mirror.x + mirror.y === 1) rotation = -rotation
        this.aroundPoint.set(worldOrigin)

        const each = (target: IUI) => {
            const event = new EditorRotateEvent(EditorRotateEvent.ROTATE, {
                target,
                editor: this,
                targetOrigin: target.getInnerPoint(worldOrigin),
                rotation
            })
            this.tool.rotate(event)
            event.target.emitEvent(event)
        }

        list.forEach(each)
        if (this.multiple) each(this.targetSimulate)
    }

    public onSkew(e: DragEvent): void {
        const { list, rect } = this
        const { around, rotateGap } = this.config
        rect.updateLayout(true)
        let { targetOrigin, skewX, skewY } = getSkewData(rect.boxBounds, (e.current as IEditPoint).direction, e.getInnerMove(rect), getAround(around, e.altKey))
        const worldOrigin = rect.getWorldPoint(targetOrigin)
        this.aroundPoint.set(worldOrigin)

        if (skewX) skewX = MathHelper.getGapRotation(skewX, rotateGap, rect.skewX)
        if (skewY) skewY = MathHelper.getGapRotation(skewY, rotateGap, rect.skewY)
        if (!skewX && !skewY) return

        const each = (target: IUI) => {
            const event = new EditorSkewEvent(EditorSkewEvent.SKEW, {
                target,
                editor: this,
                targetOrigin: target.getInnerPoint(worldOrigin),
                skewX,
                skewY
            })
            this.tool.skew(event)
            event.target.emitEvent(event)
        }

        list.forEach(each)
        if (this.multiple) each(this.targetSimulate)

        rect.updateLayout()
    }


    public destroy(): void {
        if (!this.destroyed) {
            this.targetSimulate.destroy()
            this.target = this.hoverTarget = this.targetLeafer = this.targetSimulate = null
            super.destroy()
        }
    }

}