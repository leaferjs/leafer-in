import { KeyEvent, DragEvent } from '@leafer/core'
import { IEditor, IDragEvent } from '@leafer-in/interface'

export function arrowKey(e: KeyEvent, editor: IEditor): void {
    if (editor.targetList.length) {
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
        if (move.x || move.y) editor.onMove(new DragEvent({ moveX: move.x, moveY: move.y } as IDragEvent))
    }
}