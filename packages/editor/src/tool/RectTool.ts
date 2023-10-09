import { IUI, IUIInputData, IPointData } from '@leafer-ui/interface'
import { IEditor, IEditorResizeEvent, IEditorRotateEvent, IEditorTool } from '@leafer-in/interface'

import { Bounds, Matrix } from '@leafer-ui/core'


export const RectTool: IEditorTool = {

    name: 'RectTool',

    getMirrorData(editor: IEditor): IPointData {
        const { scaleX, scaleY } = editor.target
        return {
            x: scaleX < 0 ? 1 : 0, // 1 = mirrorX
            y: scaleY < 0 ? 1 : 0
        }
    },

    resize(e: IEditorResizeEvent): void {
        const { target, bounds, resizeType, old } = e
        const { x, y, width, height } = bounds
        const point = { x: x - old.x, y: y - old.y }

        target.innerToWorld(point, null, true, target.parent)
        target.x += point.x
        target.y += point.y

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
        const { target, rotation, origin } = e
        target.rotateOf(origin, rotation)
    },

    update(editor: IEditor) {
        const { target, config, rotatePoints, targetRect, rect, circle, resizeLines, resizePoints } = editor
        const { type, resizeable, rotateable, stroke, pointFill, pointSize, pointRadius } = config

        const defaultStyle = { fill: pointFill, stroke, width: pointSize, height: pointSize, cornerRadius: pointRadius }
        const pointStyles = config.point instanceof Array ? config.point : [config.point || defaultStyle]

        const box = new Bounds(target.boxBounds)
        const w = target.worldTransform, pw = editor.parent.worldTransform

        const matrix = new Matrix(w)
        matrix.divide(pw)
        const worldX = matrix.e, worldY = matrix.f


        let { scaleX, scaleY, rotation, skewX, skewY } = w
        scaleX /= pw.scaleX, scaleY /= pw.scaleY, rotation -= pw.rotation, skewX -= pw.skewX, skewY -= pw.skewY

        const { x, y, width, height } = box.scale(scaleX, scaleY) // maybe width / height < 0

        editor.set({ x: worldX, y: worldY, rotation, skewX, skewY })
        targetRect.set({ x, y, width: box.width / scaleX, height: box.height / scaleY, scaleX, scaleY, visible: true })


        const points: IPointData[] = [ // topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left
            { x, y },
            { x: x + width / 2, y },
            { x: x + width, y },
            { x: x + width, y: y + height / 2 },
            { x: x + width, y: y + height },
            { x: x + width / 2, y: y + height },
            { x, y: y + height },
            { x, y: y + height / 2 }
        ]

        const rectPoints: number[] = []
        let point: IPointData, style: IUIInputData, rotateP: IUI, resizeP: IUI, resizeL: IUI

        for (let i = 0; i < 8; i++) {
            point = points[i]
            style = pointStyles[i % pointStyles.length]

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
                rectPoints.push(point.x, point.y)
            }
        }



        style = config.rotatePoint || style

        circle.set(style)
        circle.x = x + width / 2
        if (!style.y) circle.y = y - (10 + (resizeP.height + circle.height) / 2) * (this.getMirrorData(editor).y ? -1 : 1)
        circle.visible = rotateable && type === 'mobile'

        rect.set(config.rect || { stroke })
        rect.points = rectPoints
        rect.visible = true
    }

}