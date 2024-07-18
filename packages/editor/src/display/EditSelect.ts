import { IBounds, ILeaf, ILeafList, IUI, IEventListenerId, IPointerEvent, IFunction } from '@leafer-ui/interface'
import { Bounds, LeafList, Group } from '@leafer-ui/draw'
import { PointerEvent, DragEvent, MoveEvent, ZoomEvent } from '@leafer-ui/core'

import { IEditSelect, IEditor, ISelectArea, IStroker } from '@leafer-in/interface'

import { Stroker } from './Stroker'
import { SelectArea } from './SelectArea'
import { EditSelectHelper } from '../helper/EditSelectHelper'
import { EditorEvent } from '../event/EditorEvent'


const { findOne } = EditSelectHelper

export class EditSelect extends Group implements IEditSelect {

    public editor: IEditor

    public get dragging(): boolean { return !!this.originList }
    public get running(): boolean { const { editor } = this; return this.hittable && editor.visible && editor.hittable && editor.mergeConfig.selector }
    public get isMoveMode(): boolean { return this.app && this.app.interaction.moveMode }

    public hoverStroker: IStroker = new Stroker()
    public targetStroker: IStroker = new Stroker()

    public bounds: IBounds = new Bounds()
    public selectArea: ISelectArea = new SelectArea()

    protected originList: ILeafList
    protected needRemoveItem: IUI

    protected waitSelect: IFunction // 手机端延迟选中，防止多点触屏误选元素

    protected __eventIds: IEventListenerId[] = []

    constructor(editor: IEditor) {
        super()
        this.editor = editor
        this.addMany(this.targetStroker, this.hoverStroker, this.selectArea)
        this.__listenEvents()
    }

    // hover / select

    protected onHover(): void {
        const { editor } = this
        if (this.running && !this.dragging && !editor.dragging) {
            const { stroke, strokeWidth, hover, hoverStyle } = editor.mergeConfig
            this.hoverStroker.setTarget(hover ? this.editor.hoverTarget : null, { stroke, strokeWidth, ...(hoverStyle || {}) })
        } else {
            this.hoverStroker.target = null
        }
    }

    protected onSelect(): void {
        if (this.running) {
            const { mergeConfig: config, list } = this.editor
            const { stroke, strokeWidth } = config
            this.targetStroker.setTarget(list, { stroke, strokeWidth: Math.max(1, strokeWidth / 2) })
            this.hoverStroker.target = null
        }
    }

    public update(): void {
        if (this.targetStroker.target) this.targetStroker.forceUpdate()
    }

    // move / down

    protected onPointerMove(e: PointerEvent): void {
        const { app, editor } = this
        if (this.running && !this.isMoveMode && app.interaction.canHover && !app.interaction.dragging) {
            const find = this.findUI(e)
            editor.hoverTarget = editor.hasItem(find) ? null : find
        } if (this.isMoveMode) {
            editor.hoverTarget = null //  move.dragEmpty
        }
    }

    protected onBeforeDown(e: PointerEvent): void {
        const { select } = this.editor.mergeConfig
        if (select === 'press') {
            if (this.app.config.mobile) {
                this.waitSelect = () => this.checkAndSelect(e)
            } else {
                this.checkAndSelect(e)
            }
        }
    }

    protected onTap(e: PointerEvent): void {
        const { editor } = this
        const { select } = editor.mergeConfig

        if (select === 'tap') this.checkAndSelect(e)
        else if (this.waitSelect) this.waitSelect()

        if (this.needRemoveItem) {
            editor.removeItem(this.needRemoveItem)
        } else if (this.isMoveMode) {
            editor.target = null  // move.dragEmpty
        }

    }

    protected checkAndSelect(e: PointerEvent): void { // pointer.down or tap
        this.needRemoveItem = null

        if (this.allowSelect(e)) {
            const { editor } = this
            const find = this.findUI(e)

            if (find) {
                if (this.isMultipleSelect(e)) {
                    if (editor.hasItem(find)) this.needRemoveItem = find // 等待tap事件再实际移除
                    else editor.addItem(find)
                } else {
                    editor.target = find
                }

            } else if (this.allow(e.target)) {

                if (!e.shiftKey) editor.target = null

            }
        }
    }

    // drag

    protected onDragStart(e: DragEvent): void {
        if (this.waitSelect) this.waitSelect()

        if (this.allowDrag(e)) {
            const { editor } = this
            const { stroke, area } = editor.mergeConfig
            const { x, y } = e.getInner(this)

            this.bounds.set(x, y)

            this.selectArea.setStyle({ visible: true, stroke, x, y }, area)
            this.selectArea.setBounds(this.bounds.get())

            this.originList = editor.leafList.clone()
        }
    }

    protected onDrag(e: DragEvent): void {
        if (this.editor.dragging) {
            this.onDragEnd()
            return
        }

        if (this.dragging) {
            const { editor } = this
            const total = e.getInnerTotal(this)

            const dragBounds = this.bounds.clone().unsign()
            const list = new LeafList(editor.app.find(EditSelectHelper.findBounds, dragBounds))

            this.bounds.width = total.x
            this.bounds.height = total.y

            this.selectArea.setBounds(dragBounds.get())

            if (list.length) {

                const selectList: ILeaf[] = []

                this.originList.forEach(item => { if (!list.has(item)) selectList.push(item) })
                list.forEach(item => { if (!this.originList.has(item)) selectList.push(item) })

                if (selectList.length !== editor.list.length || editor.list.some((child, index) => child !== selectList[index])) {
                    editor.target = selectList as IUI[]
                }

            } else {

                editor.target = this.originList.list as IUI[]

            }
        }
    }

    protected onDragEnd(): void {
        if (this.dragging) this.originList = null, this.selectArea.visible = false
    }

    protected onAutoMove(e: MoveEvent): void {
        if (this.dragging) {
            const { x, y } = e.getLocalMove(this)
            this.bounds.x += x
            this.bounds.y += y
        }
    }

    // helper

    protected allow(target: ILeaf): boolean {
        return target.leafer !== this.editor.leafer
    }

    protected allowDrag(e: DragEvent) {
        if (this.running && this.editor.mergeConfig.boxSelect && !e.target.draggable) {
            return (!this.editor.editing && this.allow(e.target)) || (e.shiftKey && !findOne(e.path))
        } else {
            return false
        }
    }

    protected allowSelect(e: IPointerEvent): boolean {
        return this.running && !this.isMoveMode && !e.middle
    }

    public findDeepOne(e: PointerEvent): IUI {
        const options = { exclude: new LeafList(this.editor.editBox.rect) }
        return findOne(e.target.leafer.interaction.findPath(e, options)) as IUI
    }

    public findUI(e: PointerEvent): IUI {
        return this.isMultipleSelect(e) ? this.findDeepOne(e) : findOne(e.path)
    }

    public isMultipleSelect(e: IPointerEvent): boolean {
        return e.shiftKey || this.editor.mergeConfig.continuousSelect
    }

    protected __listenEvents(): void {
        const { editor } = this
        editor.waitLeafer(() => {

            const { app } = editor
            app.selector.proxy = editor

            this.__eventIds = [
                editor.on_(EditorEvent.HOVER, this.onHover, this),
                editor.on_(EditorEvent.SELECT, this.onSelect, this),

                app.on_(PointerEvent.MOVE, this.onPointerMove, this),
                app.on_(PointerEvent.BEFORE_DOWN, this.onBeforeDown, this),
                app.on_(PointerEvent.TAP, this.onTap, this),

                app.on_(DragEvent.START, this.onDragStart, this, true), // 采用捕获事件，需要比EditBox中的dragStart早触发
                app.on_(DragEvent.DRAG, this.onDrag, this),
                app.on_(DragEvent.END, this.onDragEnd, this),

                app.on_(MoveEvent.MOVE, this.onAutoMove, this),
                app.on_([ZoomEvent.ZOOM, MoveEvent.MOVE], () => { this.editor.hoverTarget = null }),
            ]

        })
    }

    protected __removeListenEvents(): void {
        if (this.__eventIds) {
            this.off_(this.__eventIds)
            this.__eventIds.length = 0
        }
    }

    public destroy(): void {
        this.editor = this.originList = this.needRemoveItem = null
        this.__removeListenEvents()
        super.destroy()
    }
}