import { IEditor, IUI } from '@leafer-in/interface'
import { EditEvent } from '../event/EditEvent'



export function onHover(editor: IEditor, _value: IUI): void {
    editor.emitEvent(new EditEvent(EditEvent.HOVER, { editor }))

}