import { IBounds, ILeaf, ILeafList, IUI, IEventListenerId } from '@leafer-ui/interface'
import { Bounds, PointerEvent, DragEvent, MoveEvent, LeafList, Group, ZoomEvent } from '@leafer-ui/core'

import { IEditSelect, IEditor, ISelectArea, IStroker } from '@leafer-in/interface'

import { Stroker } from './Stroker'
import { SelectArea } from './SelectArea'
import { EditSelectHelper } from '../helper/EditSelectHelper'
import { EditorEvent } from '../event/EditorEvent'


const { findOne } = EditSelectHelper

export class EditSelect extends Group implements IEditSelect {

    public editor: IEditor

    public get dragging(): boolean { return !!this.originList }
    public get running(): boolean { return this.editor.hittable && this.editor.config.selector }
    public get isMoveMode(): boolean { return this.app && this.app.interaction.moveMode }

    public hoverStroker: IStroker = new Stroker()
    public targetStroker: IStroker = new Stroker()

    public bounds: IBounds = new Bounds()
    public selectArea: ISelectArea = new SelectArea()

    protected originList: ILeafList
    protected lastDownLeaf: IUI

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
            const { stroke, strokeWidth, hover } = editor.config
            this.hoverStroker.setTarget(hover ? this.editor.hoverTarget : null, { stroke, strokeWidth })
        } else {
            this.hoverStroker.target = null
        }
    }

    protected onSelect(): void {
        if (this.running) {
            const { config, list } = this.editor
            const { stroke, strokeWidth } = config
            this.targetStroker.setTarget(list, { stroke, strokeWidth: Math.max(1, strokeWidth / 2) })
            this.hoverStroker.target = null
        }
    }

    public update(): void {
        if (this.running) this.targetStroker.forceUpdate()
    }

    // move / down

    protected onPointerMove(e: PointerEvent): void {
        const { app, editor } = this
        if (this.running && !this.isMoveMode && app.config.pointer.hover && !app.interaction.dragging) {
            const find = e.shiftKey ? this.findDeepOne(e) : findOne(e.path)
            editor.hoverTarget = editor.hasItem(find) ? null : find
        } if (this.isMoveMode) {
            editor.hoverTarget = null //  move.dragEmpty
        }
    }

    protected onBeforeDown(e: PointerEvent): void {
        if (this.editor.config.select !== PointerEvent.DOWN) return
        this.checkAndSelect(e, true)
    }

    protected onTap(e: PointerEvent): void {
        const { editor } = this
        const { select, continuousSelect } = editor.config
        if (select === PointerEvent.TAP) this.checkAndSelect(e)

        if (this.running && (e.shiftKey || continuousSelect) && !e.middle && !this.lastDownLeaf) {
            const find = this.findDeepOne(e)
            if (find) editor.shiftItem(find)
            else if (!e.shiftKey && continuousSelect) editor.target = null
        } else if (this.isMoveMode) {
            editor.target = null  // move.dragEmpty
        }

        this.lastDownLeaf = null
    }

    protected checkAndSelect(e: PointerEvent, isDownType?: boolean): void { // pointer.down or tap
        if (this.running && !this.isMoveMode && !e.middle) {
            const { editor } = this
            const find = this.lastDownLeaf = findOne(e.path)

            if (find) {

                if (e.shiftKey || editor.config.continuousSelect) {
                    editor.shiftItem(find)
                } else {
                    editor.target = find
                }

                // change down data
                if (isDownType) {
                    editor.updateLayout()
                    if (!find.locked) this.app.interaction.updateDownData(e, { findList: [editor.editBox.rect] }, editor.config.dualEvent)
                }

            } else if (this.allow(e.target)) {

                if (!e.shiftKey) editor.target = null

            }
        }
    }

    // drag

    protected onDragStart(e: DragEvent): void {
        if (this.running && this.allowDrag(e)) {
            const { editor } = this
            const { stroke, strokeWidth, area } = editor.config
            const { x, y } = e.getInner(this)

            this.bounds.set(x, y)

            this.selectArea.setStyle({ visible: true, stroke, strokeWidth, x, y }, area)
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
        if (this.editor.config.boxSelect && !e.target.draggable) {
            return (!this.editor.hasTarget && this.allow(e.target)) || (e.shiftKey && !findOne(e.path))
        } else {
            return false
        }
    }

    protected findDeepOne(e: PointerEvent): IUI {
        const options = { exclude: new LeafList(this.editor.editBox.rect) }
        return findOne(e.target.leafer.interaction.findPath(e, options)) as IUI
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

                app.on_(DragEvent.START, this.onDragStart, this),
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
        this.editor = this.originList = this.lastDownLeaf = null
        this.__removeListenEvents()
        super.destroy()
    }
}