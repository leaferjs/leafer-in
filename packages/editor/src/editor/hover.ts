import { IEditor, IUI } from '@leafer-in/interface'
import { EditorEvent } from '../event/EditorEvent'



export function onHover(editor: IEditor, _value: IUI): void {
    editor.emitEvent(new EditorEvent(EditorEvent.HOVER, { editor }))

}