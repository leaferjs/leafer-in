import { LeafList } from '@leafer-ui/draw'

import { IEditor, IUI } from '@leafer-in/interface'

import { simulate } from './simulate'
import { EditorEvent } from '../event/EditorEvent'


export function onTarget(editor: IEditor, oldValue: IUI | IUI[]): void {
    const { target } = editor
    if (target) {
        editor.leafList = target instanceof LeafList ? target : new LeafList(target)
        if (editor.multiple) simulate(editor) // 更新模拟元素
    } else {
        editor.simulateTarget.remove()
        editor.leafList.reset()
    }

    editor.closeInnerEditor()

    const data = { editor, value: target, oldValue }
    editor.emitEvent(new EditorEvent(EditorEvent.SELECT, data))
    editor.checkOpenedGroups()

    if (editor.editing) {
        editor.waitLeafer(() => {
            editor.updateEditTool()
            editor.listenTargetEvents()
        })
    } else {
        editor.updateEditTool()
        editor.removeTargetEvents()
    }

    editor.emitEvent(new EditorEvent(EditorEvent.AFTER_SELECT, data))
}


export function onHover(editor: IEditor, oldValue: IUI): void {
    editor.emitEvent(new EditorEvent(EditorEvent.HOVER, { editor, value: editor.hoverTarget, oldValue }))
}