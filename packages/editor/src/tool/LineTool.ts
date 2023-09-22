import { IDirection8, IEditor, IEditorTool, IEditorResizeEvent, IEditorRotateEvent, ILine, IPointData } from '@leafer-in/interface'

import { RectTool } from './RectTool'


const { left, right } = IDirection8

export const LineTool: IEditorTool = {

    name: 'LineTool',

    getMirrorData(_editor: IEditor): IPointData {
        return {
            x: 0,
            y: 0
        }
    },

    resize(e: IEditorResizeEvent): void {
        const { direction, dragEvent, lockRatio, around } = e
        const target = e.target as ILine

        const fromPoint = { x: 0, y: 0 }
        const { toPoint } = target

        target.rotation = 0

        let { x, y } = dragEvent.getInnerMove(target)

        if (lockRatio) {
            if (Math.abs(x) > Math.abs(y)) {
                y = 0
            } else {
                x = 0
            }
        }

        if (direction === left) {

            fromPoint.x += x
            fromPoint.y += y

            if (around) {
                toPoint.x -= x
                toPoint.y -= y
            }

        } else {

            if (around) {
                fromPoint.x -= x
                fromPoint.y -= y
            }

            toPoint.x += x
            toPoint.y += y

        }

        target.getLocalPointByInner(fromPoint, null, null, true)
        target.getLocalPointByInner(toPoint, null, null, true)
        target.x = fromPoint.x
        target.y = fromPoint.y

        target.getInnerPointByLocal(toPoint, null, null, true)
        target.toPoint = toPoint

    },

    rotate(e: IEditorRotateEvent): void {
        RectTool.rotate(e)
    },

    update(editor: IEditor) {

        const { rotatePoints, circle, resizeLines, resizePoints } = editor
        RectTool.update(editor)

        for (let i = 0; i < 8; i++) {
            if (i < 4) resizeLines[i].visible = false
            resizePoints[i].visible = rotatePoints[i].visible = i === left || i === right
        }

        circle.visible = false

    }

}