import { IRect, IAround, IEventListenerId, IBoundsData, IRectInputData, IPointData } from '@leafer-in/interface'
import { Group, Rect, DragEvent, PointerEvent } from '@leafer-ui/core'

import { IEditBox, IEditor, IDirection8, IEditPoint, IEditPointType } from '@leafer-in/interface'

import { updateCursor, updateMoveCursor } from '../editor/cursor'
import { EditEvent } from '../event/EditEvent'
import { EditPoint } from './EditPoint'


export class EditBox extends Group implements IEditBox {

    public editor: IEditor
    public dragging: boolean

    public rect: IRect = new Rect({ hitFill: 'all', hitStroke: 'none', strokeAlign: 'center', hitRadius: 5 }) // target rect
    public circle: IEditPoint = new EditPoint({ name: 'circle', around: 'center', strokeAlign: 'outside', hitRadius: 10, cursor: 'crosshair' }) // rotate point

    public resizePoints: IEditPoint[] = [] // topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left
    public rotatePoints: IEditPoint[] = [] // topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left
    public resizeLines: IEditPoint[] = [] // top, right, bottom, left

    public enterPoint: IEditPoint

    protected __eventIds: IEventListenerId[] = []

    constructor(editor: IEditor) {
        super()
        this.editor = editor
        this.visible = false
        this.create()
        this.__listenEvents()
    }

    public create() {
        let rotatePoint: IEditPoint, resizeLine: IEditPoint, resizePoint: IEditPoint
        const { resizePoints, rotatePoints, resizeLines, rect, circle } = this
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

        this.listenPointEvents(circle, 'rotate', 2)
        this.addMany(...rotatePoints, rect, circle, ...resizeLines, ...resizePoints)
    }


    public listenPointEvents(point: IEditPoint, type: IEditPointType, direction: IDirection8): void {
        const { editor } = this
        point.direction = direction
        point.pointType = type
        point.on_(DragEvent.START, () => { this.dragging = true })
        point.on_(DragEvent.DRAG, this.onDrag, this)
        point.on_(DragEvent.END, () => { this.dragging = false })
        point.on_(PointerEvent.LEAVE, () => this.enterPoint = null)
        if (point.name !== 'circle') point.on_(PointerEvent.ENTER, (e) => { this.enterPoint = point, updateCursor(editor, e) })
    }

    protected onDrag(e: DragEvent): void {
        const { editor } = this
        const point = e.current as IEditPoint
        if (point.pointType === 'rotate' || e.metaKey || e.ctrlKey || !editor.config.resizeable) {
            if (editor.config.rotateable) editor.onRotate(e)
        } else {
            editor.onScale(e)
        }
    }

    public update(bounds: IBoundsData): void {
        const { config } = this.editor
        const { width, height } = bounds
        const { rect, circle, resizePoints, rotatePoints, resizeLines } = this
        const { type, resizeable, rotateable, stroke, strokeWidth } = config

        const points = this.getDirection8Points(bounds)
        const pointsStyle = this.getDirection8PointsStyle()

        let point: IPointData, style: IRectInputData, rotateP: IRect, resizeP: IRect, resizeL: IRect

        for (let i = 0; i < 8; i++) {

            point = points[i], style = pointsStyle[i % pointsStyle.length]
            resizeP = resizePoints[i], rotateP = rotatePoints[i], resizeL = resizeLines[Math.floor(i / 2)]

            resizeP.set(style)
            resizeP.set(point), rotateP.set(point), resizeL.set(point)


            // visible 
            resizeP.visible = resizeL.visible = resizeable || rotateable
            rotateP.visible = rotateable && resizeable

            if (i % 2) {
                resizeP.visible = type === 'mobile'
                rotateP.visible = false
            } else {
                rotateP.visible = type !== 'mobile'
            }


            if (i % 2) { // top,  right, bottom, left
                if (((i + 1) / 2) % 2) { // top, bottom
                    resizeL.width = width
                    if (resizeP.width > width - 30) resizeP.visible = false
                } else {
                    resizeL.height = height
                    resizeP.rotation = 90
                    if (resizeP.width > height - 30) resizeP.visible = false
                }
            }

        }

        style = config.rotatePoint || style

        // primary rotate

        circle.set(style)
        circle.x = points[1].x
        if (!style.y) circle.y = points[1].y - (12 + (resizeP.height + circle.height) / 2)
        circle.visible = rotateable && type === 'mobile'

        rect.set(config.rect || { stroke, strokeWidth })
        rect.set({ ...bounds, visible: true })
    }

    public getDirection8PointsStyle(): IRectInputData[] {
        const { stroke, strokeWidth, pointFill, pointSize, pointRadius, point } = this.editor.config
        return point instanceof Array ? point : [point || { fill: pointFill, stroke, strokeWidth, width: pointSize, height: pointSize, cornerRadius: pointRadius }]
    }

    public getDirection8Points(bounds: IBoundsData): IPointData[] {
        const { x, y, width, height } = bounds
        return [ // topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left
            { x, y },
            { x: x + width / 2, y },
            { x: x + width, y },
            { x: x + width, y: y + height / 2 },
            { x: x + width, y: y + height },
            { x: x + width / 2, y: y + height },
            { x, y: y + height },
            { x, y: y + height / 2 }
        ]
    }

    protected onDoubleClick(): void {
        const { list } = this.editor
        if (list.length === 1 && list[0].isBranch) {
            //list[0].hitChildren = true
        }
    }

    protected __listenEvents(): void {
        const { rect, editor } = this
        this.__eventIds = [
            editor.on_(EditEvent.SELECT, () => { this.visible = !!editor.leafList.length }),
            rect.on_(DragEvent.START, () => { this.dragging = true, this.editor.opacity = this.editor.config.hideOnMove ? 0 : 1 }),
            rect.on_(DragEvent.DRAG, editor.onMove, editor),
            rect.on_(DragEvent.END, () => { this.dragging = false, this.editor.opacity = 1 }),
            rect.on_(PointerEvent.ENTER, () => updateMoveCursor(editor)),
            rect.on_(PointerEvent.DOUBLE_CLICK, this.onDoubleClick, this)
        ]
    }

    protected __removeListenEvents(): void {
        this.off_(this.__eventIds)
        this.__eventIds.length = 0
    }

    public destroy(): void {
        this.editor = null
        this.__removeListenEvents()
        super.destroy()
    }

}