import { IUI, IAround } from '@leafer-ui/interface'
import { IEditor } from '@leafer-in/interface'

import { Rect } from '@leafer-ui/core'


export function create(editor: IEditor) {
    let rotatePoint: IUI, resizeLine: IUI, resizePoint: IUI
    const { resizePoints, rotatePoints, resizeLines, box, rect, circle } = editor
    const arounds: IAround[] = [{ x: 1, y: 1 }, 'center', { x: 0, y: 1 }, 'center', { x: 0, y: 0 }, 'center', { x: 1, y: 0 }, 'center']

    for (let i = 0; i < 8; i++) {
        rotatePoint = new Rect({ around: arounds[i], width: 15, height: 15, hitFill: "all" })
        rotatePoints.push(rotatePoint)
        editor.__listenPointEvents(rotatePoint, 'rotate', i)

        if (i % 2) {
            resizeLine = new Rect({ around: 'center', width: 10, height: 10, hitFill: "all" })
            resizeLines.push(resizeLine)
            editor.__listenPointEvents(resizeLine, 'resize', i)
        }

        resizePoint = new Rect({ around: 'center', hitRadius: 5, strokeWidth: 2 })
        resizePoints.push(resizePoint)
        editor.__listenPointEvents(resizePoint, 'resize', i)
    }

    editor.__listenPointEvents(circle, 'rotate', 1)
    editor.addMany(...rotatePoints, box, rect, circle, ...resizeLines, ...resizePoints)
}