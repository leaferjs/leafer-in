import { IGroupInputData, IUI, IEventListenerId, IPointData, ILeafList, IEditSize } from '@leafer-ui/interface'
import { Group, Rect, DragEvent, RotateEvent, DataHelper, MathHelper, LeafList, Matrix } from '@leafer-ui/core'

import { IEditBox, IEditPoint, IEditor, IEditorConfig, IEditTool } from '@leafer-in/interface'

import { EditMoveEvent } from './event/EditMoveEvent'
import { EditResizeEvent } from './event/EditResizeEvent'
import { EditRotateEvent } from './event/EditRotateEvent'
import { EditSkewEvent } from './event/EditSkewEvent'

import { EditSelector } from './ui/EditSelector'
import { EditBox } from './ui/EditBox'

import { config } from './config'
import { getTool } from './tool'

import { onTarget } from './editor/target'
import { onHover } from './editor/hover'
import { getAround, getResizeData, getRotateData, getSkewData } from './editor/data'
import { EditPoint } from './ui/EditPoint'
import { targetAttr } from './decorator/data'


export class Editor extends Group implements IEditor {

    public config = config

    @targetAttr(onHover)
    public hoverTarget: IUI

    @targetAttr(onTarget)
    public target: IUI | IUI[] | ILeafList

    public get multiple(): boolean { return this.leafList.length > 1 }
    public get element() { return this.multiple ? this.targetSimulate : this.leafList.list[0] as IUI }
    public leafList: ILeafList = new LeafList() // from target

    public targetSimulate: IUI = new Rect({ visible: false })

    public editBox: IEditBox = new EditBox(this)
    public editTool: IEditTool
    public selector: EditSelector = new EditSelector(this)

    public targetEventIds: IEventListenerId[] = []

    public aroundPoint: IEditPoint = new EditPoint({ around: 'center', hitRadius: 10, width: 10, height: 10, fill: 'red' })


    constructor(userConfig?: IEditorConfig, data?: IGroupInputData) {
        super(data)
        if (userConfig) this.config = DataHelper.default(userConfig, this.config)
        this.addMany(this.selector, this.editBox)
        this.add(this.aroundPoint)
    }

    // item

    public hasItem(item: IUI): boolean {
        return this.leafList.has(item)
    }

    public addItem(item: IUI): void {
        if (!this.hasItem(item)) this.leafList.add(item), this.target = this.leafList.list as IUI[]
    }

    public removeItem(item: IUI): void {
        if (this.hasItem(item)) this.leafList.remove(item), this.target = this.leafList.list as IUI[]
    }

    public shiftItem(item: IUI): void {
        this.hasItem(item) ? this.removeItem(item) : this.addItem(item)
    }

    // update

    public getTool(value: IUI | IUI[]): IEditTool {
        return getTool(value)
    }

    public getEditSize(ui: IUI): IEditSize {
        let { resizeType } = this.config
        return resizeType === 'auto' ? ui.editSize : resizeType
    }

    public update(): void {
        if (!this.target) return
        this.editTool.update(this)
    }

    // operate

    public onMove(e: DragEvent): void {
        const { element } = this
        let { moveX, moveY } = e

        if (e.shiftKey) {
            if (Math.abs(moveX) > Math.abs(moveY)) moveY = 0
            else moveX = 0
        }

        const event = new EditMoveEvent(EditMoveEvent.MOVE, { target: element, editor: this, moveX, moveY })

        this.editTool.onMove(event)
        this.emitEvent(event)

        if (this.multiple) {
            const move = element.getLocalPoint({ x: moveX, y: moveY }, null, true)
            element.move(move.x, move.y)
        }
    }

    public onResize(e: DragEvent): void {
        const { element } = this
        const { direction } = e.current as IEditPoint

        let { around, lockRatio } = this.config
        if (e.shiftKey) lockRatio = true

        const data = getResizeData(element.boxBounds, direction, e.getInnerMove(element), lockRatio, getAround(around, e.altKey))

        let transform: Matrix
        const { origin, scaleX, scaleY } = data
        const worldOrigin = element.getWorldPoint(origin)

        if (this.multiple) {
            transform = new Matrix(element.localTransform)
            element.scaleOf(origin, scaleX, scaleY)
            transform.divideParent(element.localTransform)
        }

        const event = new EditResizeEvent(EditResizeEvent.RESIZE, {
            ...data, target: element, editor: this, dragEvent: e, transform, worldOrigin
        })

        this.editTool.onResize(event)
        this.emitEvent(event)
    }

    public onRotate(e: DragEvent | RotateEvent): void {
        const { skewable, around, rotateGap } = this.config
        const { direction } = e.current as IEditPoint
        if (skewable && direction % 2) return this.onSkew(e as DragEvent)

        const { element } = this
        let worldOrigin: IPointData, rotation: number

        if (e instanceof RotateEvent) {
            rotation = e.rotation, worldOrigin = e
        } else {
            const last = { x: e.x - e.moveX, y: e.y - e.moveY }
            const data = getRotateData(element.boxBounds, direction, e.getInner(element), element.getInnerPoint(last), e.shiftKey ? null : (around || 'center'))
            rotation = data.rotation
            worldOrigin = element.getWorldPoint(data.origin)
        }

        rotation = MathHelper.getGapRotation(rotation, rotateGap, element.rotation)
        if (!rotation) return

        const mirror = this.editTool.getMirrorData(this)
        if (mirror.x + mirror.y === 1) rotation = -rotation

        const event = new EditRotateEvent(EditRotateEvent.ROTATE, { target: element, editor: this, worldOrigin, rotation })

        this.editTool.onRotate(event)
        this.emitEvent(event)

        if (this.multiple) element.rotateOf(element.getInnerPoint(worldOrigin), rotation)
    }

    public onSkew(e: DragEvent): void {
        const { element } = this
        const { around, rotateGap } = this.config
        element.updateLayout(true)
        let { origin, skewX, skewY } = getSkewData(element.boxBounds, (e.current as IEditPoint).direction, e.getInnerMove(element), getAround(around, e.altKey))
        const worldOrigin = element.getWorldPoint(origin as IPointData)

        if (skewX) skewX = MathHelper.getGapRotation(skewX, rotateGap, element.skewX)
        if (skewY) skewY = MathHelper.getGapRotation(skewY, rotateGap, element.skewY)

        if (!skewX && !skewY) return

        const event = new EditSkewEvent(EditSkewEvent.SKEW, {
            target: element, editor: this, skewX, skewY
        })

        this.editTool.onSkew(event)
        this.emitEvent(event)

        if (this.multiple) element.skewOf(element.getInnerPoint(worldOrigin), skewX, skewY)

        this.aroundPoint.set(worldOrigin)
    }

    public destroy(): void {
        if (!this.destroyed) {
            this.targetSimulate.destroy()
            this.target = this.hoverTarget = this.targetSimulate = null
            super.destroy()
        }
    }

}

