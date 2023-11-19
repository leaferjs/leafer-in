import { IBounds, ILeaf, ILeafList, IUI, IEventListenerId } from '@leafer-ui/interface'
import { Bounds, PointerEvent, DragEvent, MoveEvent, LeafList, Group, ZoomEvent } from '@leafer-ui/core'

import { IEditSelector, IEditor, ISelectBox, IStroker } from '@leafer-in/interface'

import { Stroker } from './Stroker'
import { SelectBox } from './SelectBox'
import { SelectHelper } from '../helper/SelectHelper'
import { EditEvent } from '../event/EditEvent'


const { findOne } = SelectHelper

export class EditSelector extends Group implements IEditSelector {

    public editor: IEditor

    public get dragging(): boolean { return !!this.originList }
    public get running(): boolean { return this.editor.config.useSelector }

    public hoverStroker: IStroker = new Stroker()
    public targetStroker: IStroker = new Stroker()

    public bounds: IBounds = new Bounds()
    public selectBox: ISelectBox = new SelectBox()

    protected originList: ILeafList
    protected lastDownLeaf: IUI

    protected __eventIds: IEventListenerId[] = []


    constructor(editor: IEditor) {
        super()
        this.editor = editor
        this.addMany(this.targetStroker, this.hoverStroker, this.selectBox)
        this.__listenEvents()
    }

    // hover / select

    protected onHover(): void {
        if (this.running && !this.dragging && !this.editor.dragging) {
            this.hoverStroker.setTarget(this.editor.hoverTarget, this.editor.config)
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


    // move / down

    protected onPointerMove(e: PointerEvent): void {
        if (this.running) {
            const find = e.shiftKey ? this.findDeepOne(e) : findOne(e.path)
            this.editor.hoverTarget = this.editor.hasItem(find) ? null : find
        }
    }

    protected onBeforeDown(e: PointerEvent): void {
        if (this.running && !e.middle) {
            const find = this.lastDownLeaf = findOne(e.path)

            if (find) {

                if (e.shiftKey) {
                    this.editor.shiftItem(find)
                } else {
                    this.editor.target = find
                }

                // change down data
                this.editor.updateLayout()
                find.leafer.interaction.updateDownData()

            } else if (this.allow(e.target)) {

                if (!e.shiftKey) this.editor.target = null

            }
        }
    }

    protected onTap(e: PointerEvent): void {
        if (this.running && e.shiftKey && !e.middle && !this.lastDownLeaf) {
            const find = this.findDeepOne(e)
            if (find) this.editor.shiftItem(find)
        }
        this.lastDownLeaf = null
    }

    // drag

    protected onDragStart(e: DragEvent): void {
        if (this.running && this.allowSelect(e)) {
            const { editor } = this
            const { stroke, strokeWidth, selectBox } = editor.config
            const { x, y } = e.getInner(this)

            this.bounds.set(x, y)

            this.selectBox.setStyle({ visible: true, stroke, strokeWidth, x, y }, selectBox)
            this.selectBox.setBounds(this.bounds.get())

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
            const list = new LeafList(editor.app.find(SelectHelper.findBounds, dragBounds))

            this.bounds.width = total.x
            this.bounds.height = total.y

            this.selectBox.setBounds(dragBounds.get())

            if (list.length) {

                const selectList: ILeaf[] = []

                this.originList.forEach(item => { if (!list.has(item)) selectList.push(item) })
                list.forEach(item => { if (!this.originList.has(item)) selectList.push(item) })

                editor.target = selectList as IUI[]

            } else {

                editor.target = this.originList
                if (editor.leafList.length) editor.update()

            }
        }
    }

    protected onDragEnd(): void {
        if (this.dragging) this.originList = null, this.selectBox.visible = false
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

    protected allowSelect(e: DragEvent) {
        return (!this.editor.selected && this.allow(e.target)) || (e.shiftKey && !findOne(e.path))
    }

    protected findDeepOne(e: PointerEvent): IUI {
        const options = { exclude: new LeafList(this.editor.editBox.rect) }
        return findOne(e.target.leafer.interaction.findPath(e, options)) as IUI
    }

    protected __listenEvents(): void {
        const { editor } = this
        editor.waitLeafer(() => {

            const { app } = editor
            this.__eventIds = [
                editor.on_(EditEvent.HOVER, this.onHover, this),
                editor.on_(EditEvent.SELECT, this.onSelect, this),

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