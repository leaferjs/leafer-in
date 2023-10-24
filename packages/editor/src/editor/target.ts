import { IEditor } from '@leafer-in/interface'

import { RenderEvent, KeyEvent } from '@leafer-ui/core'

import { simulateTarget } from './simulate'
import { updateCursor } from './cursor'


export function onTarget(editor: IEditor): void {
    const { target } = editor
    removeTargetEvents(editor)
    editor.visible = !!target
    editor.simulateTarget.parent = null

    if (target) {
        editor.waitLeafer(() => {
            editor.tool = editor.getTool(target)
            simulateTarget(editor)

            editor.update()
            editor.updateMoveCursor()
            listenTargetEvents(editor)
        })
    }
}

function listenTargetEvents(editor: IEditor): void {
    if (editor.target) {
        const { leafer } = editor.list[0]
        editor.__targetEventIds = [
            leafer.on_(RenderEvent.START, editor.update, editor),
            leafer.on_([KeyEvent.HOLD, KeyEvent.UP], (e) => { updateCursor(editor, e) })
        ]
    }
}

function removeTargetEvents(editor: IEditor): void {
    if (editor.__targetEventIds.length) {
        const { leafer } = editor.list[0]
        if (leafer) leafer.off_(editor.__targetEventIds)
        editor.__targetEventIds.length = 0
    }
}