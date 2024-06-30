import { IGroupInputData, IUI, IEventListenerId, IPointData, ILeafList, IEditSize, IGroup, IObject, IAlign } from '@leafer-ui/interface'
import { Group, Rect, DataHelper, MathHelper, LeafList, Matrix, RenderEvent, LeafHelper } from '@leafer-ui/draw'
import { DragEvent, RotateEvent, KeyEvent, ZoomEvent } from '@leafer-ui/core'

import { IEditBox, IEditPoint, IEditor, IEditorConfig, IEditTool, IEditorScaleEvent, IInnerEditor } from '@leafer-in/interface'

import { EditorMoveEvent } from './event/EditorMoveEvent'
import { EditorScaleEvent } from './event/EditorScaleEvent'
import { EditorRotateEvent } from './event/EditorRotateEvent'
import { EditorSkewEvent } from './event/EditorSkewEvent'

import { EditSelect } from './display/EditSelect'
import { EditBox } from './display/EditBox'
import { EditMask } from './display/EditMask'

import { config } from './config'

import { onTarget, onHover } from './editor/target'
import { targetAttr } from './decorator/data'
import { EditorHelper } from './helper/EditorHelper'
import { EditDataHelper } from './helper/EditDataHelper'
import { simulate } from './editor/simulate'
import { updateCursor } from './editor/cursor'
import { EditToolCreator } from './tool/EditToolCreator'
import { InnerEditorEvent } from './event/InnerEditorEvent'
import { EditorGroupEvent } from './event/EditorGroupEvent'


export class Editor extends Group implements IEditor {

    public config = config

    public get mergeConfig(): IEditorConfig {
        const { element, config } = this
        return this.single && element.editConfig ? { ...config, ...element.editConfig } : config // 实时合并，后期可优化
    }

    @targetAttr(onHover)
    public hoverTarget?: IUI

    @targetAttr(onTarget)
    public target?: IUI | IUI[]

    // 列表

    public get list(): IUI[] { return this.leafList.list as IUI[] }
    public leafList: ILeafList = new LeafList() // from target
    public openedGroupList: ILeafList = new LeafList()

    // 状态

    public get editing(): boolean { return !!this.list.length }
    public innerEditing: boolean
    public get groupOpening(): boolean { return !!this.openedGroupList.length }

    public get multiple(): boolean { return this.list.length > 1 }
    public get single(): boolean { return this.list.length === 1 }

    public get dragging(): boolean { return this.editBox.dragging }

    // 组件

    public get element() { return this.multiple ? this.simulateTarget : this.list[0] as IUI }
    public simulateTarget: IUI = new Rect({ visible: false })

    public editBox: IEditBox = new EditBox(this)
    public get buttons() { return this.editBox.buttons }

    public editTool?: IEditTool

    public innerEditor?: IInnerEditor
    public editToolList: IObject = {}

    public selector: EditSelect = new EditSelect(this)
    public editMask: EditMask = new EditMask(this)

    public dragStartPoint: IPointData

    public targetEventIds: IEventListenerId[] = []


    constructor(userConfig?: IEditorConfig, data?: IGroupInputData) {
        super(data)
        if (userConfig) this.config = DataHelper.default(userConfig, this.config)
        this.addMany(this.editMask, this.selector, this.editBox)
    }

    // select 

    public select(target: IUI | IUI[]): void {
        this.target = target
    }

    public cancel(): void {
        this.target = null
    }

    // item

    public hasItem(item: IUI): boolean {
        return this.leafList.has(item)
    }

    public addItem(item: IUI): void {
        if (!this.hasItem(item) && !item.locked) this.leafList.add(item), this.target = this.leafList.list as IUI[]
    }

    public removeItem(item: IUI): void {
        if (this.hasItem(item)) this.leafList.remove(item), this.target = this.leafList.list as IUI[]
    }

    public shiftItem(item: IUI): void {
        this.hasItem(item) ? this.removeItem(item) : this.addItem(item)
    }

    // update

    public update(): void {
        if (this.editing) {
            if (this.innerEditing) this.innerEditor.update()
            this.editTool.update()
            this.selector.update()
        }
    }

    public updateEditBox(): void {
        if (this.multiple) simulate(this)
        this.update()
    }

    public updateEditTool(): void {
        const tool = this.editTool
        if (tool) {
            this.editBox.unload()
            tool.unload()
            this.editTool = null
        }

        if (this.editing) {
            const tag = this.single ? this.list[0].editOuter as string : 'EditTool'
            this.editTool = this.editToolList[tag] = this.editToolList[tag] || EditToolCreator.get(tag, this)
            this.editBox.load()
            this.editTool.load()
        }
    }


    // get

    public getEditSize(_ui: IUI): IEditSize {
        return this.mergeConfig.editSize
    }

    // operate

    public onMove(e: DragEvent): void {
        const total = { x: e.totalX, y: e.totalY }

        if (e.shiftKey) {
            if (Math.abs(total.x) > Math.abs(total.y)) total.y = 0
            else total.x = 0
        }

        this.move(DragEvent.getValidMove(this.element, this.dragStartPoint, total))
    }

    public onScale(e: DragEvent | ZoomEvent): void {
        const { element } = this

        if (e instanceof ZoomEvent) {
            if (this.mergeConfig.resizeable === 'zoom') {
                e.stop()
                this.scaleOf(element.getInnerPoint(e), e.scale, e.scale)
            }
        } else {

            const { direction } = e.current as IEditPoint
            let { around, lockRatio } = this.mergeConfig
            if (e.shiftKey || element.lockRatio) lockRatio = true

            const data = EditDataHelper.getScaleData(element.boxBounds, direction, e.getInnerMove(element), lockRatio, EditDataHelper.getAround(around, e.altKey))

            if (this.editTool.onScaleWithDrag) {
                data.drag = e
                this.scaleWithDrag(data)
            } else {
                this.scaleOf(data.origin, data.scaleX, data.scaleY)
            }

        }

    }

    public onRotate(e: DragEvent | RotateEvent): void {
        const { skewable, around, rotateGap } = this.mergeConfig
        const { direction, name } = e.current as IEditPoint
        if (skewable && name === 'resize-line') return this.onSkew(e as DragEvent)

        const { element } = this
        let origin: IPointData, rotation: number

        if (e instanceof RotateEvent) {
            if (this.mergeConfig.rotateable === 'rotate') {
                e.stop()
                rotation = e.rotation, origin = element.getInnerPoint(e)
            } else return
        } else {
            const last = { x: e.x - e.moveX, y: e.y - e.moveY }
            const data = EditDataHelper.getRotateData(element.boxBounds, direction, e.getInner(element), element.getInnerPoint(last), e.shiftKey ? null : (around || 'center'))
            rotation = data.rotation
            origin = data.origin
        }

        rotation = MathHelper.getGapRotation(rotation, rotateGap, element.rotation)
        if (!rotation) return

        if (element.scaleX * element.scaleY < 0) rotation = -rotation // flippedOne

        this.rotateOf(origin, MathHelper.float(rotation, 2))
    }


    public onSkew(e: DragEvent): void {
        const { element } = this
        const { around } = this.mergeConfig

        const { origin, skewX, skewY } = EditDataHelper.getSkewData(element.boxBounds, (e.current as IEditPoint).direction, e.getInnerMove(element), EditDataHelper.getAround(around, e.altKey))
        if (!skewX && !skewY) return

        this.skewOf(origin, skewX, skewY)
    }


    // transform

    public move(x: number | IPointData, y = 0): void {
        if (!this.mergeConfig.moveable || this.element.locked) return

        const { element } = this
        const world = element.getWorldPointByLocal(typeof x === 'object' ? { ...x } : { x, y }, null, true)
        const event = new EditorMoveEvent(EditorMoveEvent.MOVE, { target: element, editor: this, moveX: world.x, moveY: world.y })

        this.editTool.onMove(event)
        this.emitEvent(event)

        if (this.multiple) element.move(x, y)
    }

    public scaleWithDrag(data: IEditorScaleEvent): void {
        if (!this.mergeConfig.resizeable || this.element.locked) return

        const { element } = this
        const worldOrigin = element.getWorldPoint(data.origin)
        const event = new EditorScaleEvent(EditorScaleEvent.SCALE, { ...data, target: element, editor: this, worldOrigin })

        this.editTool.onScaleWithDrag(event)
        this.emitEvent(event)
    }


    public scaleOf(origin: IPointData | IAlign, scaleX: number, scaleY = scaleX, _resize?: boolean): void {
        if (!this.mergeConfig.resizeable || this.element.locked) return

        const { element } = this
        const worldOrigin = element.getWorldPoint(LeafHelper.getInnerOrigin(element, origin))

        let transform: Matrix

        if (this.multiple) {
            const oldMatrix = new Matrix(element.worldTransform)
            element.scaleOf(origin, scaleX, scaleY)
            transform = new Matrix(element.worldTransform).divide(oldMatrix) // world change transform
        }

        const event = new EditorScaleEvent(EditorScaleEvent.SCALE, { target: element, editor: this, worldOrigin, scaleX, scaleY, transform })

        this.editTool.onScale(event)
        this.emitEvent(event)
    }

    public rotateOf(origin: IPointData | IAlign, rotation: number): void {
        if (!this.mergeConfig.rotateable || this.element.locked) return

        const { element } = this
        const worldOrigin = element.getWorldPoint(LeafHelper.getInnerOrigin(element, origin))


        let transform: Matrix

        if (this.multiple) {
            const oldMatrix = new Matrix(element.worldTransform)
            element.rotateOf(origin, rotation)
            transform = new Matrix(element.worldTransform).divide(oldMatrix) // world change transform
        }

        const event = new EditorRotateEvent(EditorRotateEvent.ROTATE, { target: element, editor: this, worldOrigin, rotation, transform })

        this.editTool.onRotate(event)
        this.emitEvent(event)
    }

    public skewOf(origin: IPointData | IAlign, skewX: number, skewY = 0, _resize?: boolean): void {
        if (!this.mergeConfig.skewable || this.element.locked) return

        const { element } = this
        const worldOrigin = element.getWorldPoint(LeafHelper.getInnerOrigin(element, origin))

        let transform: Matrix

        if (this.multiple) {
            const oldMatrix = new Matrix(element.worldTransform)
            element.skewOf(origin, skewX, skewY)
            transform = new Matrix(element.worldTransform).divide(oldMatrix) // world change transform
        }

        const event = new EditorSkewEvent(EditorSkewEvent.SKEW, {
            target: element, editor: this, skewX, skewY, transform, worldOrigin
        })

        this.editTool.onSkew(event)
        this.emitEvent(event)
    }

    // group

    public group(userGroup?: IGroup | IGroupInputData): IGroup {
        if (this.multiple) {
            this.target = EditorHelper.group(this.list, this.element, userGroup)
            this.emitGroupEvent(EditorGroupEvent.GROUP, this.target as IGroup)
        }
        return this.target as IGroup
    }

    public ungroup(): IUI[] {
        const { list } = this
        if (list.length) {
            list.forEach(item => item.isBranch && this.emitGroupEvent(EditorGroupEvent.BEFORE_UNGROUP, item as IGroup))
            this.target = EditorHelper.ungroup(list)
            list.forEach(item => item.isBranch && this.emitGroupEvent(EditorGroupEvent.UNGROUP, item as IGroup))
        }
        return this.list
    }

    public openGroup(group: IGroup): void {
        this.openedGroupList.add(group)
        group.hitChildren = true
        this.emitGroupEvent(EditorGroupEvent.OPEN, group)
    }

    public closeGroup(group: IGroup): void {
        this.openedGroupList.remove(group)
        group.hitChildren = false
        this.emitGroupEvent(EditorGroupEvent.CLOSE, group)
    }

    public checkOpenedGroups(): void {
        const opened = this.openedGroupList
        if (opened.length) {
            let { list } = opened
            if (this.editing) list = [], opened.forEach(item => this.list.every(leaf => !LeafHelper.hasParent(leaf, item)) && list.push(item))
            list.forEach(item => this.closeGroup(item as IGroup))
        }
        if (this.editing && !this.selector.dragging) this.checkDeepSelect()
    }

    public checkDeepSelect(): void {
        let parent: IGroup, { list } = this
        for (let i = 0; i < list.length; i++) {
            parent = list[i].parent
            while (parent && !parent.hitChildren) {
                this.openGroup(parent)
                parent = parent.parent
            }
        }
    }

    public emitGroupEvent(type: string, group: IGroup): void {
        const event = new EditorGroupEvent(type, { editTarget: group })
        this.emitEvent(event)
        group.emitEvent(event)
    }

    // inner

    public openInnerEditor(target?: IUI): void {
        if (target) this.target = target
        if (this.single) {
            const editTarget = this.element
            const tag = editTarget.editInner
            if (tag && EditToolCreator.list[tag]) {
                this.editTool.unload()
                this.innerEditing = true
                this.innerEditor = this.editToolList[tag] || EditToolCreator.get(tag, this)
                this.innerEditor.editTarget = editTarget

                this.emitInnerEvent(InnerEditorEvent.BEFORE_OPEN)
                this.innerEditor.load()
                this.emitInnerEvent(InnerEditorEvent.OPEN)
            }
        }
    }

    public closeInnerEditor(): void {
        if (this.innerEditing) {
            this.innerEditing = false

            this.emitInnerEvent(InnerEditorEvent.BEFORE_CLOSE)
            this.innerEditor.unload()
            this.emitInnerEvent(InnerEditorEvent.CLOSE)

            this.editTool.load()
            this.innerEditor = null
        }
    }

    public emitInnerEvent(type: string): void {
        const { innerEditor } = this
        const { editTarget } = innerEditor
        const event = new InnerEditorEvent(type, { editTarget, innerEditor })
        this.emitEvent(event)
        editTarget.emitEvent(event)
    }

    // lock

    public lock(): void {
        this.list.forEach(leaf => leaf.locked = true)
        this.update()
    }

    public unlock(): void {
        this.list.forEach(leaf => leaf.locked = false)
        this.update()
    }

    // level

    public toTop(): void {
        if (this.list.length) {
            EditorHelper.toTop(this.list)
            this.leafList.update()
        }
    }

    public toBottom(): void {
        if (this.list.length) {
            EditorHelper.toBottom(this.list)
            this.leafList.update()
        }
    }

    // event 

    public listenTargetEvents(): void {
        if (!this.targetEventIds.length) {
            const { leafer } = this.list[0]
            this.targetEventIds = [
                leafer.on_(RenderEvent.START, this.update, this),
                leafer.on_([KeyEvent.HOLD, KeyEvent.UP], (e: KeyEvent) => { updateCursor(this, e) }),
                leafer.on_(KeyEvent.DOWN, this.editBox.onArrow, this.editBox)
            ]
        }
    }

    public removeTargetEvents(): void {
        const { targetEventIds } = this
        if (targetEventIds.length) {
            this.off_(targetEventIds)
            targetEventIds.length = 0
        }
    }

    public destroy(): void {
        if (!this.destroyed) {
            this.simulateTarget.destroy()
            Object.values(this.editToolList).forEach(item => item.destroy())
            this.editToolList = {}
            this.target = this.hoverTarget = this.simulateTarget = this.editTool = this.innerEditor = null
            super.destroy()
        }
    }

}