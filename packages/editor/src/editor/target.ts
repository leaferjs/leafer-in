import { LeafList } from '@leafer-ui/draw'

import { IEditor, IUI } from '@leafer-in/interface'

import { simulate } from './simulate'
import { updateMoveCursor } from './cursor'
import { EditorEvent } from '../event/EditorEvent'


export function onTarget(editor: IEditor, oldValue: IUI | IUI[]): void {
    const { target } = editor
    if (target) {
        editor.leafList = target instanceof LeafList ? target : new LeafList(target)
        if (editor.multiple) simulate(editor) // 更新模拟元素
    } else {
        editor.simulateTarget.remove()
        editor.leafList.reset()
        editor.closeInnerEditor()
    }

    editor.emitEvent(new EditorEvent(EditorEvent.SELECT, { editor, value: target, oldValue }))
    editor.checkOpenedGroups()

    if (editor.editing) {
        editor.waitLeafer(() => {
            updateMoveCursor(editor)
            editor.updateEditTool()
            editor.update()
            editor.listenTargetEvents()
        })
    } else {
        editor.updateEditTool()
        editor.removeTargetEvents()
    }
}


export function onHover(editor: IEditor, oldValue: IUI): void {
    editor.emitEvent(new EditorEvent(EditorEvent.HOVER, { editor, value: editor.hoverTarget, oldValue }))
}