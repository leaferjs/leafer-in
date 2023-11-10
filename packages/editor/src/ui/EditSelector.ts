import { IBounds, ILeaf, ILeafList, IUI, IEventListenerId } from '@leafer-ui/interface'
import { Bounds, PointerEvent, DragEvent, MoveEvent, LeafList, Group, ZoomEvent } from '@leafer-ui/core'

import { IEditSelector, IEditor, IWireframe } from '@leafer-in/interface'

import { findBounds } from '../selector/findBounds'
import { EditEvent } from '../event/EditEvent'
import { Wireframe } from './Wireframe'
import { SelectArea } from './SelectArea'


export class EditSelector extends Group implements IEditSelector {

    public editor: IEditor

    public hoverWireframe: IWireframe = new Wireframe()
    public targetWireframe: IWireframe = new Wireframe()

    public selectArea = new SelectArea()
    public dragBounds: IBounds = new Bounds()

    protected originList: ILeafList
    protected lastDown: IUI

    protected __eventIds: IEventListenerId[] = []


    constructor(editor: IEditor) {
        super()
        this.editor = editor
        this.addMany(this.targetWireframe, this.hoverWireframe, this.selectArea)
        this.__listenEvents()
    }


    protected findOneEditable(path: LeafList): IUI {
        return path.list.find((leaf) => leaf.editable) as IUI
    }

    protected inEditLayer(target: ILeaf): boolean {
        return target.leafer === this.editor.leafer
    }

    public allowSelect(e: DragEvent) {
        return (!this.editor.leafList.length && !this.inEditLayer(e.target)) || (e.shiftKey && !this.findOneEditable(e.path))
    }


    protected onBeforeDown(e: PointerEvent): void {
        if (!e.middle) {
            const find = this.lastDown = this.findOneEditable(e.path)

            if (find) {

                if (e.shiftKey) {
                    this.editor.shiftItem(find)
                } else {
                    this.editor.target = find
                }

                // change down data
                this.editor.updateLayout()
                find.leafer.interaction.updateDownData()

            } else if (!this.inEditLayer(e.target)) {

                if (!e.shiftKey) this.editor.target = null

            }
        }
    }

    protected onTap(e: PointerEvent): void {
        if (!e.middle && e.shiftKey && !this.lastDown) {
            const options = { exclude: new LeafList(this.editor.editBox.rect) }
            const find = this.findOneEditable(e.target.leafer.interaction.findPath(e, options))
            if (find) this.editor.shiftItem(find)
        }
        this.lastDown = null
    }

    protected onDragStart(e: DragEvent): void {
        if (this.allowSelect(e)) {
            const { editor } = this
            const { stroke, strokeWidth, selectArea } = editor.config
            const { x, y } = e.getInner(this)

            this.dragBounds.set(x, y)

            this.selectArea.setStyle({ visible: true, stroke, strokeWidth, x, y }, selectArea)
            this.selectArea.setBounds(this.dragBounds.get())

            this.originList = editor.leafList.clone()
        }
    }

    protected onAutoMove(e: MoveEvent): void {
        if (this.originList) {
            const { x, y } = e.getLocalMove(this)
            this.dragBounds.x += x
            this.dragBounds.y += y
        }
    }

    protected onDrag(e: DragEvent): void {
        if (this.editor.editBox.dragging) {
            this.onDragEnd()
            return
        }

        if (this.originList) {
            const { editor } = this
            const total = e.getInnerTotal(this)

            const dragBounds = this.dragBounds.clone().unsign()
            const list = new LeafList(editor.app.find(findBounds, dragBounds))

            this.dragBounds.width = total.x
            this.dragBounds.height = total.y

            this.selectArea.setBounds(dragBounds.get())

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
        if (this.originList) this.originList = null, this.selectArea.visible = false
    }

    protected __listenEvents(): void {
        const { editor } = this
        editor.waitLeafer(() => {

            const { app } = editor
            this.__eventIds = [
                editor.on_(EditEvent.HOVER, () => this.hoverWireframe.setTarget(editor.hoverTarget, editor.config)),
                editor.on_(EditEvent.SELECT, () => {
                    this.targetWireframe.setTarget(editor.leafList.list as IUI[], editor.config)
                    this.hoverWireframe.target = null
                }),

                app.on_(PointerEvent.MOVE, (e: PointerEvent) => { this.editor.hoverTarget = this.findOneEditable(e.path) }),

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
        this.editor = this.originList = this.lastDown = null
        this.__removeListenEvents()
        super.destroy()
    }
}