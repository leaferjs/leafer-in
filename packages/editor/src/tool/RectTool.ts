import { IUI, IUIInputData, IPointData, IBoundsData, IRectInputData } from '@leafer-ui/interface'
import { IEditor, IEditorResizeEvent, IEditorRotateEvent, IEditorTool, IEditorSkewEvent, IEditorMoveEvent } from '@leafer-in/interface'

export const RectTool: IEditorTool = {

    name: 'RectTool',

    getMirrorData(editor: IEditor): IPointData {
        const { scaleX, scaleY } = editor.box.targetRect
        return {
            x: scaleX < 0 ? 1 : 0, // 1 = mirrorX
            y: scaleY < 0 ? 1 : 0
        }
    },

    move(e: IEditorMoveEvent): void {
        e.target.move(e.moveX, e.moveY)
    },

    resize(e: IEditorResizeEvent): void {
        const { target, bounds, resizeType, old } = e
        const { x, y, width, height } = bounds
        const inner = { x: x - old.x, y: y - old.y } // boxBounds change

        const local = target.getLocalPointByInner(inner, null, true)
        target.x += local.x
        target.y += local.y

        if (resizeType === 'scale') {
            target.scaleX *= width / old.width
            target.scaleY *= height / old.height
        } else {

            if (width < 0) {
                target.width = -width
                target.scaleX *= -1
            } else {
                if (target.width !== width) target.width = width
            }

            if (height < 0) {
                target.height = -height
                target.scaleY *= -1
            } else {
                if (target.height !== height) target.height = height // Text auto height
            }

        }
    },

    rotate(e: IEditorRotateEvent): void {
        const { target, origin, rotation } = e
        target.rotateOf(origin, rotation)
    },

    skew(e: IEditorSkewEvent): void {
        const { target, origin, skewX, skewY } = e
        target.skewOf(origin, skewX, skewY)
    },

    update(editor: IEditor) {
        const { targetSimulate, targetList } = editor
        const { targetRect } = editor.box

        const first = targetList.list[0]

        if (editor.multiple) targetSimulate.parent.__layout.checkUpdate()

        const target = editor.multiple ? targetSimulate : first

        const orientBounds = target.getOrientBounds('box', 'world', editor, true)
        editor.box.set(orientBounds)

        const targetStyle = { x: 0, y: 0, width: orientBounds.width, height: orientBounds.height, visible: true }
        targetRect.set(targetStyle)

        updateStyle(editor, targetStyle)
    }

}


function updateStyle(editor: IEditor, boxBounds: IBoundsData): void {
    const { config } = editor
    const { rotatePoints, rect, circle, resizeLines, resizePoints } = editor.box
    const { type, resizeable, rotateable, stroke, strokeWidth } = config

    const { x, y, width, height } = boxBounds

    const points = getDirection8Points(boxBounds)
    const pointsStyle = getDirection8PointsStyle(editor)

    const rectPoints: number[] = []
    const mirror = RectTool.getMirrorData(editor)
    let point: IPointData, style: IUIInputData, rotateP: IUI, resizeP: IUI, resizeL: IUI

    for (let i = 0; i < 8; i++) {
        point = points[i]
        style = pointsStyle[i % pointsStyle.length]

        resizeP = resizePoints[i]
        resizeL = resizeLines[Math.floor(i / 2)]
        rotateP = rotatePoints[i]

        resizeP.set(style)
        resizeP.x = rotateP.x = resizeL.x = point.x
        resizeP.y = rotateP.y = resizeL.y = point.y

        resizeP.visible = resizeL.visible = resizeable || rotateable
        rotateP.visible = rotateable && resizeable

        if (i % 2) { // top,  right, bottom, left
            if (((i + 1) / 2) % 2) { // top, bottom
                resizeL.width = Math.abs(width)
                rotateP.width = Math.max(10, Math.abs(width) - 30) // skew
            } else {
                resizeL.height = Math.abs(height)
                rotateP.height = Math.max(10, Math.abs(height) - 30) // skew
            }

            resizeP.rotation = 90
            resizeP.visible = type === 'mobile'
            rotateP.visible = false

        } else {
            rotateP.visible = type !== 'mobile'
            rotateP.scaleX = mirror.x ? -1 : 1
            rotateP.scaleY = mirror.y ? -1 : 1
            rectPoints.push(point.x, point.y)
        }
    }

    style = config.rotatePoint || style

    // primary rotate

    circle.set(style)
    circle.x = x + width / 2
    if (!style.y) circle.y = y - (10 + (resizeP.height + circle.height) / 2) * (mirror.y ? -1 : 1)
    circle.visible = rotateable && type === 'mobile'

    // target stroke

    rect.set(config.rect || { stroke, strokeWidth })
    rect.points = rectPoints
    rect.visible = true
}

function getDirection8PointsStyle(editor: IEditor): IRectInputData[] {
    const { config } = editor
    const { stroke, strokeWidth, pointFill, pointSize, pointRadius } = config
    const defaultStyle = { fill: pointFill, stroke, strokeWidth, width: pointSize, height: pointSize, cornerRadius: pointRadius }
    return config.point instanceof Array ? config.point : [config.point || defaultStyle]
}

function getDirection8Points(bounds: IBoundsData): IPointData[] {
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