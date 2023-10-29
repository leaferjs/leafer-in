import { IBounds, IGroup, ILeaf, ILeafList, IRect, IUI, IEventListenerId } from '@leafer-ui/interface'
import { Bounds, PointerEvent, DragEvent, MoveEvent, Rect, LeafList, Group, ZoomEvent } from '@leafer-ui/core'

import { IEditSelector, IEditor, IWireframe } from '@leafer-in/interface'

import { findBounds } from '../selector/findBounds'
import { EditorEvent } from '../event/EditorEvent'
import { Wireframe } from './Wireframe'


export class EditSelector extends Group implements IEditSelector {

    public editor: IEditor
    public bounds: IBounds = new Bounds()

    public hoverWireframe: IWireframe = new Wireframe()
    public targetWireframe: IWireframe = new Wireframe()

    public selectArea: IGroup = new Group({ visible: false, hittable: false })
    public strokeArea: IRect = new Rect({ strokeAlign: 'center' })
    public fillArea: IRect = new Rect()

    public originList: ILeafList

    protected lastFind: IUI
    protected __eventIds: IEventListenerId[] = []

    constructor(editor: IEditor) {
        super()
        this.editor = editor
        this.__listenEvents()
    }

    protected findOneEditable(path: LeafList): IUI {
        const { targetLeafer } = this.editor
        return path.list.find((leaf) => leaf.editable && leaf.leafer === targetLeafer) as IUI
    }

    protected inEditLayer(target: ILeaf): boolean {
        return target.leafer === this.editor.leafer
    }

    public allowSelect(e: DragEvent) { return (!this.editor.targetList.length && !this.inEditLayer(e.target)) || (e.shiftKey && !this.findOneEditable(e.path)) }


    protected onDown(e: PointerEvent): void {
        if (!e.middle) {
            const find = this.lastFind = this.findOneEditable(e.path)

            if (find) {
                if (e.shiftKey) {
                    this.editor.shiftItem(find)
                } else {
                    this.editor.target = find
                }
            } else if (!this.inEditLayer(e.target)) {
                if (!e.shiftKey) this.editor.target = null
            }
        }
    }

    protected onTap(e: PointerEvent): void {
        if (!e.middle && e.shiftKey && !this.lastFind) {
            const find = this.findOneEditable(e.target.leafer.app.selector.getByPoint(e, 5, { exclude: new LeafList(this.editor.box.targetRect) }).path)
            if (find) this.editor.shiftItem(find)
        }
    }

    protected onDragStart(e: DragEvent): void {
        if (this.allowSelect(e)) {
            const { editor } = this
            const { stroke, strokeWidth, selectRect } = editor.config
            const { x, y } = e.getInner(this)
            this.bounds.x = x
            this.bounds.y = y

            this.selectArea.visible = true
            this.strokeArea.reset({ ...(selectRect || { stroke, strokeWidth }), x, y })
            this.fillArea.reset({ visible: selectRect ? false : true, fill: stroke, opacity: 0.1, x, y })

            this.originList = editor.targetList.clone()
        }

    }

    protected onDrag(e: DragEvent): void {
        if (this.editor.box.dragging) {
            this.onDragEnd()
            return
        }

        if (this.originList) {
            const { editor } = this
            const total = e.getInnerTotal(this)
            this.bounds.width = total.x
            this.bounds.height = total.y

            const dragBounds = this.bounds.clone().unsign()
            const boundsData = dragBounds.get()

            this.strokeArea.set(boundsData)
            this.fillArea.set(boundsData)

            const list = new LeafList((editor.targetLeafer as unknown as IUI).find(findBounds, dragBounds))

            if (list.length) {

                const selectList: ILeaf[] = []

                this.originList.forEach(item => {
                    if (!list.has(item)) selectList.push(item)
                })

                list.forEach(item => {
                    if (!this.originList.has(item)) selectList.push(item)
                })

                editor.target = selectList as IUI[]
            } else {
                editor.target = this.originList
                if (editor.targetList.length) editor.update()
            }
        }
    }

    protected onDragEnd(): void {
        if (this.originList) {
            this.originList = null
            this.selectArea.visible = false
        }
    }

    protected __listenEvents(): void {
        const { editor } = this
        editor.waitLeafer(() => {
            const { app } = editor.leafer
            this.selectArea.addMany(this.fillArea, this.strokeArea)
            this.addMany(this.targetWireframe, this.hoverWireframe, this.selectArea)

            this.__eventIds = [
                editor.on_(EditorEvent.HOVER, () => {
                    const { stroke, strokeWidth } = editor.config
                    this.hoverWireframe.set({ stroke, strokeWidth })
                    this.hoverWireframe.target = editor.hoverTarget
                }),
                editor.on_(EditorEvent.SELECT, () => {
                    const { stroke, strokeWidth } = editor.config
                    this.targetWireframe.set({ stroke, strokeWidth })
                    this.targetWireframe.target = editor.targetList.list as IUI[]
                    this.hoverWireframe.target = null
                }),
                app.on_(PointerEvent.DOWN, this.onDown, this),
                app.on_(PointerEvent.TAP, this.onTap, this),
                app.on_(MoveEvent.MOVE, (e: MoveEvent) => {
                    const { x, y } = e.getLocalMove(this)
                    this.bounds.x += x
                    this.bounds.y += y
                }),
                app.on_(DragEvent.START, this.onDragStart, this),
                app.on_(DragEvent.DRAG, this.onDrag, this),
                app.on_(DragEvent.END, this.onDragEnd, this),
                app.on_([ZoomEvent.ZOOM, MoveEvent.MOVE], () => { this.editor.hoverTarget = null }),
                app.on_(PointerEvent.MOVE, (e: PointerEvent) => { this.editor.hoverTarget = this.findOneEditable(e.path) })
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
        this.__removeListenEvents()
        super.destroy()
    }
}
