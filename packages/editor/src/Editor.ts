import { IGroupInputData, IUI, IEventListenerId, IPointData, ILeafList, IEditSize, IGroup, IObject, IAlign, IAxis, IFunction, IMatrix, IApp } from '@leafer-ui/interface'
import { Group, DataHelper, LeafList, RenderEvent, LeafHelper, Direction9, Plugin } from '@leafer-ui/draw'
import { DragEvent, RotateEvent, ZoomEvent, MoveEvent, useModule } from '@leafer-ui/core'

import { IEditBox, IEditPoint, IEditor, IEditorConfig, IEditTool, IEditorScaleEvent, IInnerEditor, ISimulateElement } from '@leafer-in/interface'

import { EditSelect } from './display/EditSelect'
import { EditBox } from './display/EditBox'
import { EditMask } from './display/EditMask'

import { config } from './config'

import { onTarget, onHover } from './editor/target'
import { targetAttr, mergeConfigAttr } from './decorator/data'
import { EditorHelper } from './helper/EditorHelper'
import { simulate } from './editor/simulate'
import { EditToolCreator } from './tool/EditToolCreator'
import { InnerEditorEvent } from './event/InnerEditorEvent'
import { EditorGroupEvent } from './event/EditorGroupEvent'
import { SimulateElement } from './display/SimulateElement'
import { TransformTool } from './tool/TransformTool'

@useModule(TransformTool, ['editBox', 'editTool', 'emitEvent'])
export class Editor extends Group implements IEditor {

    public config: IEditorConfig

    @mergeConfigAttr()
    readonly mergeConfig: IEditorConfig
    readonly mergedConfig: IEditorConfig

    @targetAttr(onHover)
    public hoverTarget?: IUI

    @targetAttr(onTarget)
    public target?: IUI | IUI[]

    // 列表

    public leafList: ILeafList = new LeafList() // from target
    public get list(): IUI[] { return this.leafList.list as IUI[] }
    public get dragHoverExclude(): IUI[] { return [this.editBox.rect] }
    public openedGroupList: ILeafList = new LeafList()

    // 状态

    public get editing(): boolean { return !!this.list.length }
    public innerEditing: boolean
    public get groupOpening(): boolean { return !!this.openedGroupList.length }
    public resizeDirection?: Direction9

    public get multiple(): boolean { return this.list.length > 1 }
    public get single(): boolean { return this.list.length === 1 }

    public get dragPoint(): IEditPoint { return this.editBox.dragPoint }

    public get dragging(): boolean { return this.editBox.dragging }
    public get gesturing(): boolean { return this.editBox.gesturing } // 手势操作元素中

    public get moving(): boolean { return this.editBox.moving }
    public get resizing(): boolean { return this.editBox.resizing }
    public get rotating(): boolean { return this.editBox.rotating }
    public get skewing(): boolean { return this.editBox.skewing }

    // 组件

    public get element() { return this.multiple ? this.simulateTarget : this.list[0] as ISimulateElement }
    public simulateTarget: ISimulateElement = new SimulateElement(this)

    public editBox: IEditBox = new EditBox(this)
    public get buttons() { return this.editBox.buttons }

    public editTool?: IEditTool

    public innerEditor?: IInnerEditor
    public editToolList: IObject = {}

    public selector: EditSelect = new EditSelect(this)
    public editMask: EditMask = new EditMask(this)

    public targetChanged: boolean
    public targetEventIds: IEventListenerId[] = []


    constructor(userConfig?: IEditorConfig, data?: IGroupInputData) {
        super(data)
        let mergedConfig: IEditorConfig = DataHelper.clone(config)
        if (userConfig) mergedConfig = DataHelper.default(userConfig, mergedConfig)
        this.mergedConfig = this.config = mergedConfig

        this.addMany(this.editMask, this.selector, this.editBox)
        if (!Plugin.has('resize')) this.config.editSize = 'scale'
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
            if (!this.element.parent) return this.cancel()
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
        this.unloadEditTool()

        if (this.editing) {
            const tag = this.element.editOuter || 'EditTool'
            const tool = this.editTool = this.editToolList[tag] = this.editToolList[tag] || EditToolCreator.get(tag, this)
            this.editBox.load()
            tool.load()
            this.update()
        }
    }

    public unloadEditTool(): void {
        let tool = this.editTool
        if (tool) {
            this.editBox.unload()
            tool.unload()
            this.editTool = null
        }
    }


    // get

    public getEditSize(_ui: IUI): IEditSize {
        return this.mergeConfig.editSize
    }


    // TransformTool will rewrite -----

    // operate 

    public onMove(_e: DragEvent | MoveEvent): void { }

    public onScale(_e: DragEvent | ZoomEvent): void { }

    public onRotate(_e: DragEvent | RotateEvent): void { }

    public onSkew(_e: DragEvent): void { }


    // transform

    public move(_x: number | IPointData, _y = 0): void { }

    public scaleWithDrag(_data: IEditorScaleEvent): void { }

    override scaleOf(_origin: IPointData | IAlign, scaleX: number, _scaleY = scaleX, _resize?: boolean): void { }

    override flip(_axis: IAxis): void { }

    override rotateOf(_origin: IPointData | IAlign, _rotation: number): void { }

    override skewOf(_origin: IPointData | IAlign, _skewX: number, _skewY = 0, _resize?: boolean): void { }

    public checkTransform(_type: 'moveable' | 'resizeable' | 'rotateable' | 'skewable'): boolean { return undefined }

    protected getWorldOrigin(_origin: IPointData | IAlign): IPointData { return undefined }

    protected getChangedTransform(_func: IFunction): IMatrix { return undefined }

    // --------


    // group

    public group(userGroup?: IGroup | IGroupInputData): IGroup {
        if (this.multiple) {
            this.emitGroupEvent(EditorGroupEvent.BEFORE_GROUP)
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
        this.emitGroupEvent(EditorGroupEvent.BEFORE_OPEN, group)
        this.openedGroupList.add(group)
        group.hitChildren = true
        this.emitGroupEvent(EditorGroupEvent.OPEN, group)
    }

    public closeGroup(group: IGroup): void {
        this.emitGroupEvent(EditorGroupEvent.BEFORE_CLOSE, group)
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

    public emitGroupEvent(type: string, group?: IGroup): void {
        const event = new EditorGroupEvent(type, { editTarget: group })
        this.emitEvent(event)
        if (group) group.emitEvent(event)
    }

    // inner

    public openInnerEditor(target?: IUI, select?: boolean): void {
        if (target && select) this.target = target
        if (this.single) {
            const editTarget = target || this.element
            const tag = editTarget.editInner
            if (tag && EditToolCreator.list[tag]) {
                this.editTool.unload()
                this.innerEditing = true
                this.innerEditor = this.editToolList[tag] = this.editToolList[tag] || EditToolCreator.get(tag, this)
                this.innerEditor.editTarget = editTarget

                this.emitInnerEvent(InnerEditorEvent.BEFORE_OPEN)
                this.innerEditor.load()
                this.emitInnerEvent(InnerEditorEvent.OPEN)
            }
        }
    }

    public closeInnerEditor(onlyInnerEditor?: boolean): void {
        if (this.innerEditing) {
            this.innerEditing = false

            this.emitInnerEvent(InnerEditorEvent.BEFORE_CLOSE)
            this.innerEditor.unload()
            this.emitInnerEvent(InnerEditorEvent.CLOSE)

            if (!onlyInnerEditor) this.updateEditTool()
            this.innerEditor = null
        }
    }

    public emitInnerEvent(type: string): void {
        const { innerEditor } = this, { editTarget } = innerEditor
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

    protected onAppRenderStart(app: IApp): void {
        if (this.targetChanged = app.children.some(leafer => leafer !== this.leafer && leafer.renderer.changed)) this.editBox.forceRender()
    }

    protected onRenderStart(): void {
        if (this.targetChanged) this.update()
    }


    // event 

    public listenTargetEvents(): void {
        if (!this.targetEventIds.length) {
            const { app, leafer, editMask } = this
            this.targetEventIds = [
                leafer.on_(RenderEvent.START, this.onRenderStart, this),
                app.on_(RenderEvent.CHILD_START, this.onAppRenderStart, this)
            ]
            if (editMask.visible) editMask.forceRender()
        }
    }

    public removeTargetEvents(): void {
        const { targetEventIds, editMask } = this
        if (targetEventIds.length) {
            this.off_(targetEventIds)
            if (editMask.visible) editMask.forceRender()
        }
    }

    public destroy(): void {
        if (!this.destroyed) {
            this.target = this.hoverTarget = null

            Object.values(this.editToolList).forEach(item => item.destroy())
            this.simulateTarget.destroy()

            this.editToolList = {}
            this.simulateTarget = this.editTool = this.innerEditor = null

            super.destroy()
        }
    }

}