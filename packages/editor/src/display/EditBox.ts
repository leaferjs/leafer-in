import { IRect, IAround, IEventListenerId, IBoundsData, IRectInputData, IPointData, IKeyEvent, IGroup } from '@leafer-ui/interface'
import { Group, Rect, DragEvent, PointerEvent } from '@leafer-ui/core'

import { IEditBox, IEditor, IDirection8, IEditPoint, IEditPointType } from '@leafer-in/interface'

import { updateCursor, updateMoveCursor } from '../editor/cursor'
import { EditorEvent } from '../event/EditorEvent'
import { EditPoint } from './EditPoint'


export class EditBox extends Group implements IEditBox {

    public editor: IEditor
    public dragging: boolean

    public rect: IRect = new Rect({ name: 'rect', hitFill: 'all', hitStroke: 'none', strokeAlign: 'center', hitRadius: 5 }) // target rect
    public circle: IEditPoint = new EditPoint({ name: 'circle', strokeAlign: 'outside', hitRadius: 5, cursor: 'crosshair' }) // rotate point

    public resizePoints: IEditPoint[] = [] // topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left
    public rotatePoints: IEditPoint[] = [] // topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left
    public resizeLines: IEditPoint[] = [] // top, right, bottom, left

    public enterPoint: IEditPoint
    public buttons: IGroup = new Group({ around: 'center', hitSelf: false })

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
        const { resizePoints, rotatePoints, resizeLines, rect, circle, buttons } = this
        const arounds: IAround[] = [{ x: 1, y: 1 }, { x: 0.5, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 0.5 }, { x: 0, y: 0 }, { x: 0.5, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 0.5 }]

        for (let i = 0; i < 8; i++) {
            rotatePoint = new EditPoint({ around: arounds[i], width: 15, height: 15, hitFill: "all" })
            rotatePoints.push(rotatePoint)
            this.listenPointEvents(rotatePoint, 'rotate', i)

            if (i % 2) {
                resizeLine = new EditPoint({ name: 'resize-line', around: 'center', width: 10, height: 10, hitFill: "all" })
                resizeLines.push(resizeLine)
                this.listenPointEvents(resizeLine, 'resize', i)
            }

            resizePoint = new EditPoint({ name: 'resize-point', around: 'center', strokeAlign: 'outside', hitRadius: 5 })
            resizePoints.push(resizePoint)
            this.listenPointEvents(resizePoint, 'resize', i)
        }

        buttons.add(circle)
        this.listenPointEvents(circle, 'rotate', 2)

        this.addMany(...rotatePoints, rect, buttons, ...resizeLines, ...resizePoints)
    }

    // update

    public update(bounds: IBoundsData): void {
        const { config, list } = this.editor
        const { width, height } = bounds
        const { rect, circle, resizePoints, rotatePoints, resizeLines } = this
        const { showRotatePoint, showMiddlePoints, resizeable, rotateable, stroke, strokeWidth } = config

        const points = this.getDirection8Points(bounds)
        const pointsStyle = this.getDirection8PointsStyle()

        this.visible = list[0] && !list[0].locked // check locked

        let point: IPointData, style: IRectInputData, rotateP: IRect, resizeP: IRect, resizeL: IRect

        for (let i = 0; i < 8; i++) {

            point = points[i], style = pointsStyle[i % pointsStyle.length]
            resizeP = resizePoints[i], rotateP = rotatePoints[i], resizeL = resizeLines[Math.floor(i / 2)]

            resizeP.set(style)
            resizeP.set(point), rotateP.set(point), resizeL.set(point)

            // visible 
            resizeP.visible = resizeL.visible = resizeable || rotateable
            rotateP.visible = rotateable && resizeable

            if (i % 2) { // top,  right, bottom, left

                resizeP.visible = rotateP.visible = !!showMiddlePoints

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

        // rotate
        style = config.rotatePoint || style
        circle.set(style)
        circle.visible = rotateable && !!showRotatePoint

        // rect
        rect.set(config.rect || { stroke, strokeWidth })
        rect.set({ ...bounds, visible: true })

        // buttons
        this.layoutButtons()
    }

    protected layoutButtons(): void {
        const { buttons, resizePoints } = this
        const { buttonsPosition, buttonsMargin } = this.editor.config

        let point: IEditPoint, scale = 1, maxHeight = 0
        buttons.children.forEach(child => maxHeight = Math.max(maxHeight, child.height))

        if (buttonsPosition === 'bottom') {
            point = resizePoints[5]
        } else {
            point = resizePoints[1]
            scale = -1
        }

        const margin = (buttonsMargin + (point.height + maxHeight) / 2) * scale

        buttons.x = point.x
        buttons.y = point.y + margin
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

    // drag

    protected onDragStart(e: DragEvent): void {
        this.dragging = true
        if (e.target.name === 'rect') this.editor.opacity = this.editor.config.hideOnMove ? 0 : 1 // move
    }

    protected onDragEnd(e: DragEvent): void {
        this.dragging = false
        if (e.target.name === 'rect') this.editor.opacity = 1 // move
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

    public onArrow(e: IKeyEvent): void {
        if (this.editor.hasTarget) {
            const move = { x: 0, y: 0 }
            const distance = e.shiftKey ? 10 : 1
            switch (e.code) {
                case 'ArrowDown':
                    move.y = distance
                    break
                case 'ArrowUp':
                    move.y = -distance
                    break
                case 'ArrowLeft':
                    move.x = -distance
                    break
                case 'ArrowRight':
                    move.x = distance
            }
            if (move.x || move.y) this.editor.move(move.x, move.y)
        }
    }

    protected onDoubleClick(): void {
        const { editor } = this
        if (editor.single && editor.element.isBranch) {
            //list[0].hitChildren = true
        }
    }

    public listenPointEvents(point: IEditPoint, type: IEditPointType, direction: IDirection8): void {
        const { editor } = this
        point.direction = direction
        point.pointType = type
        point.on_(DragEvent.START, this.onDragStart, this)
        point.on_(DragEvent.DRAG, this.onDrag, this)
        point.on_(DragEvent.END, this.onDragEnd, this)
        point.on_(PointerEvent.LEAVE, () => this.enterPoint = null)
        if (point.name !== 'circle') point.on_(PointerEvent.ENTER, (e) => { this.enterPoint = point, updateCursor(editor, e) })
    }

    protected __listenEvents(): void {
        const { rect, editor } = this
        this.__eventIds = [
            editor.on_(EditorEvent.SELECT, () => { this.visible = editor.hasTarget }),
            rect.on_(DragEvent.START, this.onDragStart, this),
            rect.on_(DragEvent.DRAG, editor.onMove, editor),
            rect.on_(DragEvent.END, this.onDragEnd, this),
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