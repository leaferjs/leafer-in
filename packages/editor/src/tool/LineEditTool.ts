import { IDirection8, IEditor, IEditResizeEvent, ILine, IPointData, IEditSkewEvent } from '@leafer-in/interface'

import { EditTool } from './EditTool'


const { left, right } = IDirection8

export class LineEditTool extends EditTool {

    public tag = 'Line'

    getMirrorData(_editor: IEditor): IPointData {
        return {
            x: 0,
            y: 0
        }
    }

    onScale(e: IEditResizeEvent): void {
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

    }

    onSkew(_e: IEditSkewEvent): void {

    }

    update(editor: IEditor) {
        const { rotatePoints, circle, resizeLines, resizePoints } = editor.editBox
        super.update(editor)

        for (let i = 0; i < 8; i++) {
            if (i < 4) resizeLines[i].visible = false
            resizePoints[i].visible = rotatePoints[i].visible = i === left || i === right
        }

        circle.visible = false
    }

}