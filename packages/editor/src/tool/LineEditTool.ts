import { IEditorScaleEvent, ILine, IEditorSkewEvent, IPointData, IAround, IPathCommandData, IFromToData, IUI, IDragEvent } from '@leafer-in/interface'

import { getPointData, Direction9, PointHelper } from '@leafer-ui/draw'

import { EditTool } from './EditTool'
import { registerEditTool } from './EditToolCreator'


const { left, right } = Direction9
const { move, copy, toNumberPoints } = PointHelper

@registerEditTool()
export class LineEditTool extends EditTool {

    public get tag() { return 'LineEditTool' }

    public scaleOfEvent = true

    onScaleWithDrag(e: IEditorScaleEvent): void {
        const { drag, direction, lockRatio, around } = e
        const line = e.target as ILine
        const isDragFrom = direction === left

        if (line.pathInputed) {

            const { path } = line.__
            const { from, to } = this.getFromToByPath(path)

            this.dragPoint(from, to, isDragFrom, around, this.getInnerMove(line, drag, lockRatio))

            path[1] = from.x, path[2] = from.y
            path[4] = to.x, path[5] = to.y
            line.path = path

        } else if (line.points) {

            const { points } = line
            const { from, to } = this.getFromToByPoints(points)

            this.dragPoint(from, to, isDragFrom, around, this.getInnerMove(line, drag, lockRatio))

            points[0] = from.x, points[1] = from.y
            points[2] = to.x, points[3] = to.y
            line.points = points

        } else {

            const from = getPointData()
            const { toPoint } = line
            line.rotation = 0

            this.dragPoint(from, toPoint, isDragFrom, around, this.getInnerMove(line, drag, lockRatio))

            line.getLocalPointByInner(from, null, null, true)
            line.getLocalPointByInner(toPoint, null, null, true)
            line.x = from.x
            line.y = from.y

            line.getInnerPointByLocal(toPoint, null, null, true)
            line.toPoint = toPoint

        }

    }

    getInnerMove(ui: IUI, event: IDragEvent, lockRatio: boolean | 'corner'): IPointData {
        const movePoint = event.getInnerMove(ui)
        if (lockRatio) Math.abs(movePoint.x) > Math.abs(movePoint.y) ? movePoint.y = 0 : movePoint.x = 0
        return movePoint
    }

    getFromToByPath(path: IPathCommandData): IFromToData {
        return {
            from: { x: path[1], y: path[2] },
            to: { x: path[4], y: path[5] }
        }
    }

    getFromToByPoints(originPoints: number[] | IPointData[]): IFromToData {
        const points = toNumberPoints(originPoints)
        return {
            from: { x: points[0], y: points[1] },
            to: { x: points[2], y: points[3] }
        }

    }

    dragPoint(fromPoint: IPointData, toPoint: IPointData, isDragFrom: boolean, around: IAround, movePoint: IPointData): void {
        const { x, y } = movePoint
        if (isDragFrom) {
            move(fromPoint, x, y)
            if (around) move(toPoint, -x, -y)
        } else {
            if (around) move(fromPoint, -x, -y)
            move(toPoint, x, y)
        }
    }

    onSkew(_e: IEditorSkewEvent): void {

    }

    onUpdate() {
        const { editBox } = this, { rotatePoints, resizeLines, resizePoints, rect } = editBox
        const line = this.editor.element as ILine

        let fromTo: IFromToData, leftOrRight: boolean
        if (line.pathInputed) fromTo = this.getFromToByPath(line.__.path)
        else if (line.points) fromTo = this.getFromToByPoints(line.__.points)

        if (fromTo) {
            const { from, to } = fromTo
            line.innerToWorld(from, from, false, editBox)
            line.innerToWorld(to, to, false, editBox)
            rect.pen.clearPath().moveTo(from.x, from.y).lineTo(to.x, to.y)
            copy(resizePoints[7] as IPointData, from)
            copy(rotatePoints[7] as IPointData, from)
            copy(resizePoints[3] as IPointData, to)
            copy(rotatePoints[3] as IPointData, to)
        }

        for (let i = 0; i < 8; i++) {
            if (i < 4) resizeLines[i].visible = false
            leftOrRight = i === left || i === right
            resizePoints[i].visible = leftOrRight
            rotatePoints[i].visible = fromTo ? false : leftOrRight
        }
    }

}