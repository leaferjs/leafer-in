import { IEditor, IUI } from '@leafer-in/interface'

import { LeafList } from '@leafer-ui/core'

import { simulate } from './simulate'
import { updateMoveCursor } from './cursor'
import { EditorEvent } from '../event/EditorEvent'


export function onTarget(editor: IEditor): void {
    const { target } = editor
    if (target) {
        editor.leafList = target instanceof LeafList ? target : new LeafList(target instanceof Array ? target : target as IUI)
    } else {
        editor.leafList.reset()
    }

    editor.emitEvent(new EditorEvent(EditorEvent.SELECT, { editor }))
    editor.targetSimulate.parent = null

    if (editor.hasTarget) {
        editor.waitLeafer(() => {
            editor.app.selector.list = new LeafList()
            if (editor.multiple) simulate(editor)

            updateMoveCursor(editor)

            editor.updateEditTool()
            editor.update()
            editor.listenTargetEvents()
        })
    } else {
        editor.removeTargetEvents()
    }
}



export function onHover(editor: IEditor): void {
    editor.emitEvent(new EditorEvent(EditorEvent.HOVER, { editor }))

}