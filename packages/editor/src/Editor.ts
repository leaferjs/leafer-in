import { IGroupInputData, IUI, IEventListenerId, IPointData, ILeafList, IEditSize } from '@leafer-ui/interface'
import { Group, Rect, DragEvent, RotateEvent, DataHelper, MathHelper, LeafList, Matrix } from '@leafer-ui/core'

import { IEditBox, IEditPoint, IEditor, IEditorConfig, IEditTool } from '@leafer-in/interface'

import { EditMoveEvent } from './event/EditMoveEvent'
import { EditScaleEvent } from './event/EditScaleEvent'
import { EditRotateEvent } from './event/EditRotateEvent'
import { EditSkewEvent } from './event/EditSkewEvent'

import { EditSelector } from './display/EditSelector'
import { EditBox } from './display/EditBox'

import { config } from './config'
import { getTool } from './tool'

import { onTarget } from './editor/target'
import { onHover } from './editor/hover'
import { getAround, getResizeData, getRotateData, getSkewData } from './editor/data'
import { targetAttr } from './decorator/data'
import { EditHelper } from './helper/EditHelper'


export class Editor extends Group implements IEditor {

    public config = config

    @targetAttr(onHover)
    public hoverTarget: IUI

    @targetAttr(onTarget)
    public target: IUI | IUI[] | ILeafList

    public get multiple(): boolean { return this.leafList.length > 1 }
    public get element() { return this.multiple ? this.targetSimulate : this.leafList.list[0] as IUI }

    public leafList: ILeafList = new LeafList() // from target
    public get list(): IUI[] { return this.leafList.list as IUI[] }

    public targetSimulate: IUI = new Rect({ visible: false })

    public editBox: IEditBox = new EditBox(this)
    public editTool: IEditTool
    public selector: EditSelector = new EditSelector(this)

    public get dragging(): boolean { return this.editBox.dragging }

    public targetEventIds: IEventListenerId[] = []


    constructor(userConfig?: IEditorConfig, data?: IGroupInputData) {
        super(data)
        if (userConfig) this.config = DataHelper.default(userConfig, this.config)
        this.addMany(this.selector, this.editBox)
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
        const move = e.getLocalMove(this.element)

        if (e.shiftKey) {
            if (Math.abs(move.x) > Math.abs(move.y)) move.y = 0
            else move.x = 0
        }

        this.move(move.x, move.y)
    }

    public onScale(e: DragEvent): void {
        const { element } = this
        const { direction } = e.current as IEditPoint

        let { around, lockRatio } = this.config
        if (e.shiftKey) lockRatio = true

        const { origin, scaleX, scaleY } = getResizeData(element.boxBounds, direction, e.getInnerMove(element), lockRatio, getAround(around, e.altKey))

        this.scaleOf(origin, scaleX, scaleY)
    }

    public onRotate(e: DragEvent | RotateEvent): void {
        const { skewable, around, rotateGap } = this.config
        const { direction } = e.current as IEditPoint
        if (skewable && direction % 2) return this.onSkew(e as DragEvent)

        const { element } = this
        let origin: IPointData, rotation: number

        if (e instanceof RotateEvent) {
            rotation = e.rotation, origin = element.getInnerPoint(e)
        } else {
            const last = { x: e.x - e.moveX, y: e.y - e.moveY }
            const data = getRotateData(element.boxBounds, direction, e.getInner(element), element.getInnerPoint(last), e.shiftKey ? null : (around || 'center'))
            rotation = data.rotation
            origin = data.origin
        }

        rotation = MathHelper.getGapRotation(rotation, rotateGap, element.rotation)
        if (!rotation) return

        const mirror = this.editTool.getMirrorData(this)
        if (mirror.x + mirror.y === 1) rotation = -rotation

        this.rotateOf(origin, rotation)
    }


    public onSkew(e: DragEvent): void {
        const { element } = this
        const { around, rotateGap } = this.config
        element.updateLayout()
        let { origin, skewX, skewY } = getSkewData(element.boxBounds, (e.current as IEditPoint).direction, e.getInnerMove(element), getAround(around, e.altKey))

        if (skewX) skewX = MathHelper.getGapRotation(skewX, rotateGap, element.skewX)
        if (skewY) skewY = MathHelper.getGapRotation(skewY, rotateGap, element.skewY)

        if (!skewX && !skewY) return

        this.skewOf(origin, skewX, skewY)
    }


    // transform

    public move(x: number, y: number): void {
        const { element } = this
        const world = element.getWorldPointByLocal({ x, y }, null, true)
        const event = new EditMoveEvent(EditMoveEvent.MOVE, { target: element, editor: this, moveX: world.x, moveY: world.y })

        this.editTool.onMove(event)
        this.emitEvent(event)

        if (this.multiple) element.move(x, y)
    }

    public scaleOf(origin: IPointData, scaleX: number, scaleY?: number, _resize?: boolean): void {
        const { element } = this
        const worldOrigin = element.getWorldPoint(origin)

        let transform: Matrix

        if (this.multiple) {
            const childMatrix = { ...element.localTransform }
            element.scaleOf(origin, scaleX, scaleY)
            transform = new Matrix(element.localTransform)
            transform.divide(childMatrix)
        }

        const event = new EditScaleEvent(EditScaleEvent.SCALE, { target: element, editor: this, worldOrigin, scaleX, scaleY, transform })

        this.editTool.onScale(event)
        this.emitEvent(event)
    }

    public rotateOf(origin: IPointData, rotation: number): void {
        const { element } = this
        const worldOrigin = element.getWorldPoint(origin)

        const event = new EditRotateEvent(EditRotateEvent.ROTATE, { target: element, editor: this, worldOrigin, rotation })

        this.editTool.onRotate(event)
        this.emitEvent(event)

        if (this.multiple) element.rotateOf(origin, rotation)
    }

    public skewOf(origin: IPointData, skewX: number, skewY?: number, _resize?: boolean): void {
        const { element } = this
        const worldOrigin = element.getWorldPoint(origin)

        let transform: Matrix

        if (this.multiple) {
            transform = new Matrix(element.localTransform)
            element.skewOf(origin, skewX, skewY)
            transform.divideParent(element.localTransform)
        }

        const event = new EditSkewEvent(EditSkewEvent.SKEW, {
            target: element, editor: this, skewX, skewY, transform, worldOrigin
        })

        this.editTool.onSkew(event)
        this.emitEvent(event)
    }

    // group

    public group(): void {
        if (this.multiple) this.target = EditHelper.group(this.list, this.element)
    }


    public ungroup(): void {
        if (this.list.length) this.target = EditHelper.ungroup(this.list)
    }

    // lock

    public lock(): void {
        this.list.forEach(leaf => leaf.locked = true)
    }

    public unlock(): void {
        this.list.forEach(leaf => leaf.locked = false)
    }

    // level

    public toTop(): void {
        if (this.list.length) {
            EditHelper.toTop(this.list)
            this.leafList.update()
        }
    }

    public toBottom(): void {
        if (this.list.length) {
            EditHelper.toBottom(this.list)
            this.leafList.update()
        }
    }

    public destroy(): void {
        if (!this.destroyed) {
            this.targetSimulate.destroy()
            this.target = this.hoverTarget = this.targetSimulate = null
            super.destroy()
        }
    }

}