import { IUI, IAround } from '@leafer-ui/interface'
import { IEditor, IDirection8 } from '@leafer-in/interface'

import { Rect, DragEvent, PointerEvent } from '@leafer-ui/core'

import { updateCursor } from './cursor'


export function create(editor: IEditor) {
    let rotatePoint: IUI, resizeLine: IUI, resizePoint: IUI
    const { resizePoints, rotatePoints, resizeLines, box, rect, circle } = editor
    const arounds: IAround[] = [{ x: 1, y: 1 }, 'center', { x: 0, y: 1 }, 'center', { x: 0, y: 0 }, 'center', { x: 1, y: 0 }, 'center']

    for (let i = 0; i < 8; i++) {
        rotatePoint = new Rect({ around: arounds[i], width: 15, height: 15, hitFill: "all" })
        rotatePoints.push(rotatePoint)
        listenPointEvents(rotatePoint, 'rotate', i, editor)

        if (i % 2) {
            resizeLine = new Rect({ around: 'center', width: 10, height: 10, hitFill: "all" })
            resizeLines.push(resizeLine)
            listenPointEvents(resizeLine, 'resize', i, editor)
        }

        resizePoint = new Rect({ around: 'center', hitRadius: 5, strokeWidth: 2 })
        resizePoints.push(resizePoint)
        listenPointEvents(resizePoint, 'resize', i, editor)
    }

    listenPointEvents(circle, 'rotate', 1, editor)
    editor.addMany(...rotatePoints, box, rect, circle, ...resizeLines, ...resizePoints)
}

function listenPointEvents(point: IUI, type: 'rotate' | 'resize', direction: IDirection8, editor: IEditor): void {
    point.__.__direction = direction
    const resize = point.__.__isResizePoint = type === 'resize'
    point.on_(DragEvent.DRAG, resize ? editor.onDrag : editor.onRotate, editor) // i % 2 ? this.onSkew : 
    point.on_(PointerEvent.LEAVE, () => editor.enterPoint = null)
    point.on_(PointerEvent.ENTER, (e) => { editor.enterPoint = point; updateCursor(editor, e) })
}