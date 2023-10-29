import { IPolygon, IRect, IAround, IEventListenerId } from '@leafer-in/interface'
import { Group, Polygon, Rect, DragEvent, PointerEvent } from '@leafer-ui/core'

import { IEditBox, IEditor, IDirection8, IEditPoint, IEditPointType } from '@leafer-in/interface'

import { updateCursor, updateMoveCursor } from '../editor/cursor'
import { EditorEvent } from '../event/EditorEvent'
import { EditPoint } from './EditPoint'


export class EditBox extends Group implements IEditBox {

    public editor: IEditor
    public dragging: boolean

    public targetRect: IRect = new Rect({ hitFill: 'all', hitRadius: 5 }) // target rect
    public rect: IPolygon = new Polygon({ hittable: false, strokeAlign: 'center' }) // target stroke, no scale
    public circle: IEditPoint = new EditPoint({ around: 'center', hitRadius: 10 }) // rotate point

    public resizePoints: IEditPoint[] = [] // topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left
    public rotatePoints: IEditPoint[] = [] // topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left
    public resizeLines: IEditPoint[] = [] // top, right, bottom, left

    public enterPoint: IEditPoint

    protected __eventIds: IEventListenerId[] = []

    constructor(editor: IEditor) {
        super()
        this.editor = editor
        this.create()
        this.__listenEvents()
    }

    public create() {
        let rotatePoint: IEditPoint, resizeLine: IEditPoint, resizePoint: IEditPoint
        const { resizePoints, rotatePoints, resizeLines, targetRect, rect, circle } = this
        const arounds: IAround[] = [{ x: 1, y: 1 }, 'center', { x: 0, y: 1 }, 'center', { x: 0, y: 0 }, 'center', { x: 1, y: 0 }, 'center']

        for (let i = 0; i < 8; i++) {
            rotatePoint = new EditPoint({ around: arounds[i], width: 15, height: 15, hitFill: "all" })
            rotatePoints.push(rotatePoint)
            this.listenPointEvents(rotatePoint, 'rotate', i)

            if (i % 2) {
                resizeLine = new EditPoint({ around: 'center', width: 10, height: 10, hitFill: "all" })
                resizeLines.push(resizeLine)
                this.listenPointEvents(resizeLine, 'resize', i)
            }

            resizePoint = new EditPoint({ around: 'center', strokeAlign: 'outside', hitRadius: 5 })
            resizePoints.push(resizePoint)
            this.listenPointEvents(resizePoint, 'resize', i)
        }

        this.listenPointEvents(circle, 'rotate', 1)
        this.addMany(...rotatePoints, targetRect, rect, circle, ...resizeLines, ...resizePoints)
    }


    public listenPointEvents(point: IEditPoint, type: IEditPointType, direction: IDirection8): void {
        const { editor } = this
        point.direction = direction
        point.pointType = type
        point.on_(DragEvent.START, () => { this.dragging = true })
        point.on_(DragEvent.DRAG, this.onDrag, this)
        point.on_(DragEvent.END, () => { this.dragging = false })
        point.on_(PointerEvent.LEAVE, () => this.enterPoint = null)
        point.on_(PointerEvent.ENTER, (e) => { this.enterPoint = point, updateCursor(editor, e) })
    }

    protected onDrag(e: DragEvent): void {
        const { editor } = this
        const point = e.current as IEditPoint
        const { resizeable, rotateable } = editor.config
        if (point.pointType === 'rotate' || e.metaKey || e.ctrlKey || !resizeable) {
            if (rotateable) editor.onRotate(e)
        } else {
            editor.onResize(e)
        }
    }

    protected __listenEvents(): void {
        const { targetRect, editor } = this
        this.__eventIds = [
            editor.on_(EditorEvent.SELECT, () => { this.visible = !!editor.targetList.length }),
            targetRect.on_(DragEvent.START, () => { this.dragging = true, this.opacity = this.editor.config.hideOnMove ? 0 : 1 }),
            targetRect.on_(DragEvent.DRAG, editor.onMove, editor),
            targetRect.on_(DragEvent.END, () => { this.dragging = false, this.opacity = 1 }),
            targetRect.on_(PointerEvent.ENTER, () => updateMoveCursor(editor))
        ]
    }

    protected __removeListenEvents(): void {
        this.off_(this.__eventIds)
        this.__eventIds.length = 0
    }

    public destroy(): void {
        this.__removeListenEvents()
        super.destroy()
    }

}