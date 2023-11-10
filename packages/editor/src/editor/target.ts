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

    const { leafList: targetList } = editor
    editor.targetSimulate.parent = null
    editor.leafer.app.selector.list = new LeafList()

    if (targetList.length) {
        editor.waitLeafer(() => {
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
        if (!editor.targetLeafer) editor.targetLeafer = editor.leafList.indexAt(0).leafer
        const { targetLeafer } = editor
        editor.targetEventIds = [
            targetLeafer.on_(RenderEvent.START, editor.update, editor),
            targetLeafer.on_([KeyEvent.HOLD, KeyEvent.UP], (e) => { updateCursor(editor, e) }),
            targetLeafer.on_(KeyEvent.DOWN, (e) => { arrowKey(e, editor) })
        ]
    }
}

function removeTargetEvents(editor: IEditor): void {
    if (editor.targetEventIds.length) {
        const { targetLeafer } = editor
        if (targetLeafer) targetLeafer.off_(editor.targetEventIds)
        editor.targetEventIds.length = 0
    }
}
