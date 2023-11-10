import { IEditor } from '@leafer-in/interface'
import { EditEvent } from '../event/EditEvent'



export function onHover(editor: IEditor): void {
    editor.emitEvent(new EditEvent(EditEvent.HOVER, { editor }))

}