import { IEditorGroupEvent } from '@leafer-in/interface'

import { EditorEvent } from './EditorEvent'
import { IUI } from '@leafer-ui/interface'
import { } from '../tool/InnerEditor'


export class EditorGroupEvent extends EditorEvent implements IEditorGroupEvent {

    static GROUP = 'editor.group'
    static UNGROUP = 'editor.ungroup'

    static OPEN = 'editor.group.open'
    static CLOSE = 'editor.group.close'

    readonly editTarget: IUI

    constructor(type: string, data?: IEditorGroupEvent) {
        super(type, data)
    }

}