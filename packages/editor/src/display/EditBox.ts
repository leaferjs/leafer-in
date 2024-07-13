import { IRect, IEventListenerId, IBoundsData, IPointData, IKeyEvent, IGroup, IBox, IBoxInputData, IAlign } from '@leafer-ui/interface'
import { Group, Box, AroundHelper, Direction9 } from '@leafer-ui/draw'
import { DragEvent, PointerEvent, RotateEvent, ZoomEvent } from '@leafer-ui/core'

import { IEditBox, IEditor, IEditPoint, IEditPointType } from '@leafer-in/interface'

import { updateCursor, updateMoveCursor } from '../editor/cursor'
import { EditorEvent } from '../event/EditorEvent'
import { EditPoint } from './EditPoint'
import { EditDataHelper } from '../helper/EditDataHelper'


const fourDirection = ['top', 'right', 'bottom', 'left']

export class EditBox extends Group implements IEditBox {

    public editor: IEditor
    public dragging: boolean
    public moving: boolean

    public view: IGroup = new Group()  // 放置默认编辑工具控制点

    public rect: IBox = new Box({ name: 'rect', hitFill: 'all', hitStroke: 'none', strokeAlign: 'center', hitRadius: 5 }) // target rect
    public circle: IEditPoint = new EditPoint({ name: 'circle', strokeAlign: 'center', around: 'center', cursor: 'crosshair', hitRadius: 5 }) // rotate point

    public buttons: IGroup = new Group({ around: 'center', hitSelf: false })

    public resizePoints: IEditPoint[] = [] // topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left
    public rotatePoints: IEditPoint[] = [] // topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left
    public resizeLines: IEditPoint[] = [] // top, right, bottom, left

    // fliped
    public get flipped(): boolean { return this.flippedX || this.flippedY }
    public get flippedX(): boolean { return this.scaleX < 0 }
    public get flippedY(): boolean { return this.scaleY < 0 }
    public get flippedOne(): boolean { return this.scaleX * this.scaleY < 0 }

    public enterPoint: IEditPoint

    protected __eventIds: IEventListenerId[] = []

    constructor(editor: IEditor) {
        super()
        this.editor = editor
        this.visible = false
        this.create()
        this.rect.syncEventer = editor // rect的事件不会冒泡，需要手动传递给editor
        this.__listenEvents()
    }

    public create() {
        let rotatePoint: IEditPoint, resizeLine: IEditPoint, resizePoint: IEditPoint
        const { view, resizePoints, rotatePoints, resizeLines, rect, circle, buttons } = this
        const arounds: IAlign[] = ['bottom-right', 'bottom', 'bottom-left', 'left', 'top-left', 'top', 'top-right', 'right']

        for (let i = 0; i < 8; i++) {
            rotatePoint = new EditPoint({ name: 'rotate-point', around: arounds[i], width: 15, height: 15, hitFill: "all" })
            rotatePoints.push(rotatePoint)
            this.listenPointEvents(rotatePoint, 'rotate', i)

            if (i % 2) {
                resizeLine = new EditPoint({ name: 'resize-line', around: 'center', width: 10, height: 10, hitFill: "all" })
                resizeLines.push(resizeLine)
                this.listenPointEvents(resizeLine, 'resize', i)
            }

            resizePoint = new EditPoint({ name: 'resize-point', hitRadius: 5 })
            resizePoints.push(resizePoint)
            this.listenPointEvents(resizePoint, 'resize', i)
        }

        buttons.add(circle)
        this.listenPointEvents(circle, 'rotate', 2)

        view.addMany(...rotatePoints, rect, buttons, ...resizeLines, ...resizePoints)
        this.add(view)
    }

    public load(): void {
        const { mergeConfig, element, single } = this.editor
        const { rect, circle, resizePoints } = this
        const { stroke, strokeWidth, moveable } = mergeConfig

        const pointsStyle = this.getPointsStyle()
        const middlePointsStyle = this.getMiddlePointsStyle()

        let resizeP: IRect

        for (let i = 0; i < 8; i++) {
            resizeP = resizePoints[i]
            resizeP.set(this.getPointStyle((i % 2) ? middlePointsStyle[((i - 1) / 2) % middlePointsStyle.length] : pointsStyle[(i / 2) % pointsStyle.length]))
            if (!(i % 2)) resizeP.rotation = (i / 2) * 90
        }

        // rotate
        circle.set(this.getPointStyle(mergeConfig.rotatePoint || pointsStyle[0]))

        // rect
        rect.set({ stroke, strokeWidth, ...(mergeConfig.rect || {}) })
        rect.hittable = !single && moveable

        // 编辑框作为底部虚拟元素， 在 onSelect 方法移除
        element.syncEventer = (single && moveable) ? rect : null
        this.app.interaction.bottomList = (single && moveable) ? [{ target: rect, proxy: element }] : null

    }

    public update(bounds: IBoundsData): void {
        this.visible = !this.editor.element.locked

        if (this.view.worldOpacity) {
            const { mergeConfig } = this.editor
            const { width, height } = bounds
            const { rect, circle, resizePoints, rotatePoints, resizeLines } = this
            const { middlePoint, resizeable, rotateable, hideOnSmall } = mergeConfig

            const smallSize = typeof hideOnSmall === 'number' ? hideOnSmall : 10
            const showPoints = !(hideOnSmall && width < smallSize && height < smallSize)

            let point = {} as IPointData, rotateP: IRect, resizeP: IRect, resizeL: IRect

            for (let i = 0; i < 8; i++) {

                AroundHelper.toPoint(AroundHelper.directionData[i], bounds, point)
                resizeP = resizePoints[i]
                rotateP = rotatePoints[i]
                resizeL = resizeLines[Math.floor(i / 2)]
                resizeP.set(point)
                rotateP.set(point)
                resizeL.set(point)

                // visible 
                resizeP.visible = resizeL.visible = showPoints && !!(resizeable || rotateable)
                rotateP.visible = showPoints && rotateable && resizeable && !mergeConfig.rotatePoint

                if (i % 2) { // top,  right, bottom, left

                    resizeP.visible = rotateP.visible = showPoints && !!middlePoint

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
            circle.visible = showPoints && rotateable && !!mergeConfig.rotatePoint

            // rect
            if (rect.path) rect.path = null // line可能会变成path优先模式
            rect.set({ ...bounds, visible: true })

            // buttons
            const buttonVisible = showPoints && (circle.visible || this.buttons.children.length > 1)
            this.buttons.visible = buttonVisible
            if (buttonVisible) this.layoutButtons()
        }
    }

    protected layoutButtons(): void {
        const { buttons, resizePoints } = this
        const { buttonsDirection, buttonsFixed, buttonsMargin, middlePoint } = this.editor.mergeConfig

        const { flippedX, flippedY } = this
        let index = fourDirection.indexOf(buttonsDirection)
        if ((index % 2 && flippedX) || ((index + 1) % 2 && flippedY)) {
            if (buttonsFixed) index = (index + 2) % 4 // flip x / y
        }
        const direction = buttonsFixed ? EditDataHelper.getRotateDirection(index, this.flippedOne ? this.rotation : -this.rotation, 4) : index

        const point = resizePoints[direction * 2 + 1] // 4 map 8 direction
        const useX = direction % 2  // left / right
        const sign = (!direction || direction === 3) ? -1 : 1 // top / left = -1

        const useWidth = index % 2 // left / right  origin direction
        const margin = (buttonsMargin + (useWidth ? ((middlePoint ? point.width : 0) + buttons.boxBounds.width) : ((middlePoint ? point.height : 0) + buttons.boxBounds.height)) / 2) * sign

        if (useX) {
            buttons.x = point.x + margin
            buttons.y = point.y
        } else {
            buttons.x = point.x
            buttons.y = point.y + margin
        }

        if (buttonsFixed) {
            buttons.rotation = (direction - index) * 90
            buttons.scaleX = flippedX ? -1 : 1
            buttons.scaleY = flippedY ? -1 : 1
        }

    }

    public unload(): void {
        this.visible = false
    }


    public getPointStyle(userStyle?: IBoxInputData): IBoxInputData {
        const { stroke, strokeWidth, pointFill, pointSize, pointRadius } = this.editor.mergeConfig
        const defaultStyle = { fill: pointFill, stroke, strokeWidth, around: 'center', strokeAlign: 'center', width: pointSize, height: pointSize, cornerRadius: pointRadius } as IBoxInputData
        return userStyle ? Object.assign(defaultStyle, userStyle) : defaultStyle
    }

    public getPointsStyle(): IBoxInputData[] {
        const { point } = this.editor.mergeConfig
        return point instanceof Array ? point : [point]
    }

    public getMiddlePointsStyle(): IBoxInputData[] {
        const { middlePoint } = this.editor.mergeConfig
        return middlePoint instanceof Array ? middlePoint : (middlePoint ? [middlePoint] : this.getPointsStyle())
    }

    protected onSelect(e: EditorEvent): void {
        if (e.oldList.length === 1) {
            e.oldList[0].syncEventer = null
            if (this.app) this.app.interaction.bottomList = null
        }
    }

    // drag

    protected onDragStart(e: DragEvent): void {
        this.dragging = true
        if (e.current.name === 'rect') {
            const { editor } = this
            this.moving = true
            editor.dragStartPoint = { x: editor.element.x, y: editor.element.y }
            editor.opacity = editor.mergeConfig.hideOnMove ? 0 : 1 // move
        }
    }

    protected onDragEnd(e: DragEvent): void {
        this.dragging = false
        this.moving = false
        if (e.current.name === 'rect') this.editor.opacity = 1 // move

    }

    protected onDrag(e: DragEvent): void {
        const { editor } = this
        const point = this.enterPoint = e.current as IEditPoint
        if (point.pointType === 'rotate' || e.metaKey || e.ctrlKey || !editor.mergeConfig.resizeable) {
            if (editor.mergeConfig.rotateable) editor.onRotate(e)
        } else if (point.pointType === 'resize') {
            editor.onScale(e)
        }
        updateCursor(editor, e)
    }

    public onArrow(e: IKeyEvent): void {
        if (this.editor.editing && this.editor.mergeConfig.keyEvent) {
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
            this.editor.move(move)
        }
    }


    protected onDoubleTap(e: PointerEvent): void {
        if (this.editor.mergeConfig.openInner === 'double') this.openInner(e)
    }

    protected onLongPress(e: PointerEvent): void {
        if (this.editor.mergeConfig.openInner === 'long') this.openInner(e)
    }

    protected openInner(e: PointerEvent): void {
        const { editor } = this
        if (editor.single) {
            const { element } = editor
            if (element.isBranch) {
                editor.openGroup(element as IGroup)
                editor.target = editor.selector.findDeepOne(e)
            } else {
                editor.openInnerEditor()
            }
        }
    }


    public listenPointEvents(point: IEditPoint, type: IEditPointType, direction: Direction9): void {
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
            editor.on_(EditorEvent.SELECT, this.onSelect, this),

            rect.on_(DragEvent.START, this.onDragStart, this),
            rect.on_(DragEvent.DRAG, editor.onMove, editor),
            rect.on_(DragEvent.END, this.onDragEnd, this),

            rect.on_(ZoomEvent.BEFORE_ZOOM, editor.onScale, editor, true),
            rect.on_(RotateEvent.BEFORE_ROTATE, editor.onRotate, editor, true),

            rect.on_(PointerEvent.ENTER, () => updateMoveCursor(editor)),
            rect.on_(PointerEvent.DOUBLE_TAP, this.onDoubleTap, this),
            rect.on_(PointerEvent.LONG_PRESS, this.onLongPress, this)
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