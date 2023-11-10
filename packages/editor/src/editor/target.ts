import { IEditor, IUI } from '@leafer-in/interface'

import { RenderEvent, KeyEvent, LeafList } from '@leafer-ui/core'

import { simulate } from './simulate'
import { updateCursor, updateMoveCursor } from './cursor'
import { arrowKey } from './arrowKey'
import { EditEvent } from '../event/EditEvent'


export function onTarget(editor: IEditor): void {
    const value = editor.target
    if (value) {
        editor.leafList = value instanceof LeafList ? value : new LeafList(value instanceof Array ? value : [value as IUI])
    } else {
        editor.leafList.reset()
    }

    editor.emitEvent(new EditEvent(EditEvent.SELECT, { editor }))
    editor.targetSimulate.parent = null

    if (editor.leafList.length) {
        editor.waitLeafer(() => {
            editor.app.selector.list = new LeafList()
            editor.editTool = editor.getTool(editor.leafList.list as IUI[])
            if (editor.multiple) simulate(editor)

            editor.update()
            updateMoveCursor(editor)
            listenTargetEvents(editor)
        })
    } else {
        removeTargetEvents(editor)
    }
}

function listenTargetEvents(editor: IEditor): void {
    if (!editor.targetEventIds.length) {
        const { leafer } = editor.leafList.list[0]
        editor.targetEventIds = [
            leafer.on_(RenderEvent.START, editor.update, editor),
            leafer.on_([KeyEvent.HOLD, KeyEvent.UP], (e) => { updateCursor(editor, e) }),
            leafer.on_(KeyEvent.DOWN, (e) => { arrowKey(e, editor) })
        ]
    }
}

function removeTargetEvents(editor: IEditor): void {
    const { targetEventIds } = editor
    if (targetEventIds.length) {
        const { app } = targetEventIds[0].current
        if (app) app.off_(editor.targetEventIds)
        targetEventIds.length = 0
    }
}
