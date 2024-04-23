import { IDirection8, IEditor, IEditorScaleEvent, ILine, IEditorSkewEvent } from '@leafer-in/interface'

import { getPointData } from '@leafer-ui/draw'

import { EditTool } from './EditTool'
import { registerEditTool } from './EditToolCreator'



const { left, right } = IDirection8

@registerEditTool()
export class LineEditTool extends EditTool {

    public get tag() { return 'LineEditTool' }

    public scaleOfEvent = true

    onScaleWithDrag(e: IEditorScaleEvent): void {
        const { drag, direction, lockRatio, around } = e
        const target = e.target as ILine

        const fromPoint = getPointData()
        const { toPoint } = target

        target.rotation = 0

        let { x, y } = drag.getInnerMove(target)

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

    onSkew(_e: IEditorSkewEvent): void {

    }

    update(editor: IEditor) {
        const { rotatePoints, resizeLines, resizePoints } = editor.editBox
        super.update(editor)

        for (let i = 0; i < 8; i++) {
            if (i < 4) resizeLines[i].visible = false
            resizePoints[i].visible = rotatePoints[i].visible = (i === left || i === right)
        }
    }

}