import { IRect, IEventListenerId, IBoundsData, IPointData, IKeyEvent, IGroup, IBox, IBoxInputData, IAlign, IUI, IEditorConfig, IEditorDragStartData, IEventParams, ITransformTool } from '@leafer-ui/interface'
import { Group, Box, Text, AroundHelper, Direction9, ResizeEvent } from '@leafer-ui/draw'
import { DragEvent, PointerEvent, KeyEvent } from '@leafer-ui/core'

import { IEditBox, IEditor, IEditPoint, IEditPointType } from '@leafer-in/interface'

import { updateCursor, updateMoveCursor } from '../editor/cursor'
import { EditorEvent } from '../event/EditorEvent'
import { EditPoint } from './EditPoint'
import { EditDataHelper } from '../helper/EditDataHelper'


const fourDirection = ['top', 'right', 'bottom', 'left'], editConfig: IEditorConfig = undefined

export class EditBox extends Group implements IEditBox {

    public editor: IEditor

    public dragging: boolean
    public moving: boolean

    public view: IGroup = new Group()  // 放置默认编辑工具控制点

    public rect: IBox = new Box({ name: 'rect', hitFill: 'all', hitStroke: 'none', strokeAlign: 'center', hitRadius: 5 }) // target rect
    public circle: IEditPoint = new EditPoint({ name: 'circle', strokeAlign: 'center', around: 'center', cursor: 'crosshair', hitRadius: 5 }) // rotate point
    public buttons: IGroup = new Group({ around: 'center', hitSelf: false, visible: 0 })

    public resizePoints: IEditPoint[] = [] // topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left
    public rotatePoints: IEditPoint[] = [] // topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left
    public resizeLines: IEditPoint[] = [] // top, right, bottom, left

    public enterPoint: IEditPoint
    public dragPoint: IEditPoint // 正在拖拽的控制点

    public dragStartData = {} as IEditorDragStartData

    public config: IEditorConfig
    public mergedConfig: IEditorConfig

    public get mergeConfig(): IEditorConfig {
        const { config } = this, { mergeConfig } = this.editor
        return this.mergedConfig = config ? { ...mergeConfig, ...config } : mergeConfig
    }

    protected _target: IUI
    public get target(): IUI { return this._target || this.editor.element } // 操作的元素，默认为editor.element
    public set target(target: IUI) { this._target = target }

    public get single(): boolean { return this.editor.single }

    protected _transformTool: ITransformTool
    public get transformTool(): ITransformTool { return this._transformTool || this.editor }
    public set transformTool(tool: ITransformTool) { this._transformTool = tool }

    // fliped
    public get flipped(): boolean { return this.flippedX || this.flippedY }
    public get flippedX(): boolean { return this.scaleX < 0 }
    public get flippedY(): boolean { return this.scaleY < 0 }
    public get flippedOne(): boolean { return this.scaleX * this.scaleY < 0 }

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

        this.listenPointEvents(circle, 'rotate', 2)

        view.addMany(...rotatePoints, rect, circle, buttons, ...resizeLines, ...resizePoints)
        this.add(view)
    }

    public load(): void {
        const { target, mergeConfig, single, rect, circle, resizePoints } = this
        const { stroke, strokeWidth } = mergeConfig

        const pointsStyle = this.getPointsStyle()
        const middlePointsStyle = this.getMiddlePointsStyle()

        let resizeP: IRect

        for (let i = 0; i < 8; i++) {
            resizeP = resizePoints[i]
            resizeP.set(this.getPointStyle((i % 2) ? middlePointsStyle[((i - 1) / 2) % middlePointsStyle.length] : pointsStyle[(i / 2) % pointsStyle.length]))
            if (!(i % 2)) resizeP.rotation = (i / 2) * 90
        }

        // rotate
        circle.set(this.getPointStyle(mergeConfig.circle || mergeConfig.rotatePoint || pointsStyle[0]))

        // rect
        rect.set({ stroke, strokeWidth, editConfig, ...(mergeConfig.rect || {}) })
        rect.hittable = !single
        rect.syncEventer = single && this.editor  // 单选下 rect 的事件不会冒泡，需要手动传递给editor

        // 编辑框作为底部虚拟元素， 在 onSelect 方法移除
        if (single) {
            target.syncEventer = rect
            this.app.interaction.bottomList = [{ target: rect, proxy: target }]
        }

        updateMoveCursor(this)
    }

    public update(): void {
        const { editor } = this
        const { x, y, scaleX, scaleY, rotation, skewX, skewY, width, height } = this.target.getLayoutBounds('box', editor, true)
        this.set({ x, y, scaleX, scaleY, rotation, skewX, skewY })
        this.updateBounds({ x: 0, y: 0, width, height })
    }

    public updateBounds(bounds: IBoundsData): void {
        const { editMask } = this.editor
        const { mergeConfig, single, rect, circle, buttons, resizePoints, rotatePoints, resizeLines } = this
        const { middlePoint, resizeable, rotateable, hideOnSmall, editBox, mask } = mergeConfig

        this.visible = !this.target.locked
        editMask.visible = mask ? true : 0

        if (this.view.worldOpacity) {
            const { width, height } = bounds
            const smallSize = typeof hideOnSmall === 'number' ? hideOnSmall : 10
            const showPoints = editBox && !(hideOnSmall && width < smallSize && height < smallSize)

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
                        if (hideOnSmall && resizeP.width * 2 > width) resizeP.visible = false
                    } else {
                        resizeL.height = height
                        resizeP.rotation = 90
                        if (hideOnSmall && resizeP.width * 2 > height) resizeP.visible = false
                    }
                }

            }

            // rotate
            circle.visible = showPoints && rotateable && !!(mergeConfig.circle || mergeConfig.rotatePoint)
            if (circle.visible) this.layoutCircle()

            // rect
            if (rect.path) rect.path = null // line可能会变成path优先模式
            rect.set({ ...bounds, visible: single ? editBox : true })

            // buttons
            buttons.visible = showPoints && buttons.children.length > 0 || 0
            if (buttons.visible) this.layoutButtons()
        } else rect.set(bounds) // 需要更新大小
    }

    protected layoutCircle(): void {
        const { circleDirection, circleMargin, buttonsMargin, buttonsDirection, middlePoint } = this.mergedConfig
        const direction = fourDirection.indexOf(circleDirection || ((this.buttons.children.length && buttonsDirection === 'bottom') ? 'top' : 'bottom'))
        this.setButtonPosition(this.circle, direction, circleMargin || buttonsMargin, !!middlePoint)
    }

    protected layoutButtons(): void {
        const { buttons } = this
        const { buttonsDirection, buttonsFixed, buttonsMargin, middlePoint } = this.mergedConfig

        const { flippedX, flippedY } = this
        let index = fourDirection.indexOf(buttonsDirection)
        if ((index % 2 && flippedX) || ((index + 1) % 2 && flippedY)) {
            if (buttonsFixed) index = (index + 2) % 4 // flip x / y
        }

        const direction = buttonsFixed ? EditDataHelper.getRotateDirection(index, this.flippedOne ? this.rotation : -this.rotation, 4) : index
        this.setButtonPosition(buttons, direction, buttonsMargin, !!middlePoint)

        if (buttonsFixed) buttons.rotation = (direction - index) * 90
        buttons.scaleX = flippedX ? -1 : 1
        buttons.scaleY = flippedY ? -1 : 1
    }

    protected setButtonPosition(buttons: IUI, direction: number, buttonsMargin: number, useMiddlePoint: boolean): void {
        const point = this.resizePoints[direction * 2 + 1] // 4 map 8 direction
        const useX = direction % 2  // left / right
        const sign = (!direction || direction === 3) ? -1 : 1 // top / left = -1

        const useWidth = direction % 2 // left / right  origin direction
        const margin = (buttonsMargin + (useWidth ? ((useMiddlePoint ? point.width : 0) + buttons.boxBounds.width) : ((useMiddlePoint ? point.height : 0) + buttons.boxBounds.height)) / 2) * sign

        if (useX) {
            buttons.x = point.x + margin
            buttons.y = point.y
        } else {
            buttons.x = point.x
            buttons.y = point.y + margin
        }
    }


    public unload(): void {
        this.visible = false
    }


    public getPointStyle(userStyle?: IBoxInputData): IBoxInputData {
        const { stroke, strokeWidth, pointFill, pointSize, pointRadius } = this.mergedConfig
        const defaultStyle = { fill: pointFill, stroke, strokeWidth, around: 'center', strokeAlign: 'center', width: pointSize, height: pointSize, cornerRadius: pointRadius, offsetX: 0, offsetY: 0, editConfig } as IBoxInputData
        return userStyle ? Object.assign(defaultStyle, userStyle) : defaultStyle
    }

    public getPointsStyle(): IBoxInputData[] {
        const { point } = this.mergedConfig
        return point instanceof Array ? point : [point]
    }

    public getMiddlePointsStyle(): IBoxInputData[] {
        const { middlePoint } = this.mergedConfig
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
        const point = this.dragPoint = e.current as IEditPoint, { pointType } = point
        const { editor, dragStartData } = this, { target } = this
        if (point.name === 'rect') {
            this.moving = true
            editor.opacity = this.mergedConfig.hideOnMove ? 0 : 1 // move
        }
        dragStartData.x = e.x
        dragStartData.y = e.y
        dragStartData.point = { x: target.x, y: target.y } // 用于移动
        dragStartData.bounds = { ...target.getLayoutBounds('box', 'local') } // 用于resize
        dragStartData.rotation = target.rotation // 用于旋转
        if (pointType && pointType.includes('resize')) ResizeEvent.resizingKeys = editor.leafList.keys // 记录正在resize中的元素列表
    }

    protected onDragEnd(e: DragEvent): void {
        this.dragging = false
        this.dragPoint = null
        this.moving = false
        const { name, pointType } = e.current as IEditPoint
        if (name === 'rect') this.editor.opacity = 1 // move
        if (pointType && pointType.includes('resize')) ResizeEvent.resizingKeys = null
    }

    protected onDrag(e: DragEvent): void {
        const { transformTool } = this, point = e.current as IEditPoint
        if (point.name === 'rect') {
            transformTool.onMove(e)
            updateMoveCursor(this)
        } else {
            const { pointType } = this.enterPoint = point
            if (pointType.includes('rotate') || e.metaKey || e.ctrlKey || !this.mergedConfig.resizeable) {
                transformTool.onRotate(e)
                if (pointType === 'resize-rotate') transformTool.onScale(e)
            } else if (pointType === 'resize') transformTool.onScale(e)
            if (pointType === 'skew') transformTool.onSkew(e)
            updateCursor(this, e)
        }
    }

    protected onKey(e: KeyEvent): void {
        updateCursor(this, e)
    }

    public onArrow(e: IKeyEvent): void {
        const { editor } = this
        if (editor.editing && this.mergedConfig.keyEvent) {
            let x = 0, y = 0
            const distance = e.shiftKey ? 10 : 1
            switch (e.code) {
                case 'ArrowDown':
                    y = distance
                    break
                case 'ArrowUp':
                    y = -distance
                    break
                case 'ArrowLeft':
                    x = -distance
                    break
                case 'ArrowRight':
                    x = distance
            }
            if (x || y) editor.move(x, y)
        }
    }


    protected onDoubleTap(e: PointerEvent): void {
        if (this.mergedConfig.openInner === 'double') this.openInner(e)
    }

    protected onLongPress(e: PointerEvent): void {
        if (this.mergedConfig.openInner === 'long') this.openInner(e)
    }

    protected openInner(e: PointerEvent): void {
        const { editor, target } = this
        if (this.single) {
            if (target.locked) return
            if (target.isBranch && !target.editInner) {
                if ((target as IBox).textBox) {
                    const { children } = target
                    const find = children.find(item => item.editable && item instanceof Text) || children.find(item => item instanceof Text)
                    if (find) return editor.openInnerEditor(find) // 文本Box直接进入编辑状态，如便利贴文本
                }

                editor.openGroup(target as IGroup)
                editor.target = editor.selector.findDeepOne(e)
            } else {
                editor.openInnerEditor()
            }
        }
    }


    public listenPointEvents(point: IEditPoint, type: IEditPointType, direction: Direction9): void {
        point.direction = direction
        point.pointType = type

        const events: IEventParams[] = [
            [DragEvent.START, this.onDragStart, this],
            [DragEvent.DRAG, this.onDrag, this],
            [DragEvent.END, this.onDragEnd, this],
            [PointerEvent.LEAVE, () => { this.enterPoint = null }],
        ]
        if (point.name !== 'circle') events.push([PointerEvent.ENTER, (e: PointerEvent) => { this.enterPoint = point, updateCursor(this, e) }])
        this.__eventIds.push(point.on_(events))
    }

    protected __listenEvents(): void {
        const { rect, editor, __eventIds: events } = this

        events.push(
            editor.on_(EditorEvent.SELECT, this.onSelect, this),

            rect.on_([
                [DragEvent.START, this.onDragStart, this],
                [DragEvent.DRAG, this.onDrag, this],
                [DragEvent.END, this.onDragEnd, this],

                [PointerEvent.ENTER, () => updateMoveCursor(this)],
                [PointerEvent.DOUBLE_TAP, this.onDoubleTap, this],
                [PointerEvent.LONG_PRESS, this.onLongPress, this]
            ])
        )

        this.waitLeafer(() => {
            events.push(
                editor.app.on_([
                    [[KeyEvent.HOLD, KeyEvent.UP], this.onKey, this],
                    [KeyEvent.DOWN, this.onArrow, this]
                ])
            )
        })
    }

    protected __removeListenEvents(): void {
        this.off_(this.__eventIds)
    }

    public destroy(): void {
        this.editor = null
        this.__removeListenEvents()
        super.destroy()
    }

}