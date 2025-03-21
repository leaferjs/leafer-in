import { IEditorGroupEvent } from '@leafer-in/interface'

import { EditorEvent } from './EditorEvent'
import { IGroup } from '@leafer-ui/interface'
import { } from '../tool/InnerEditor'


export class EditorGroupEvent extends EditorEvent implements IEditorGroupEvent {


    static BEFORE_GROUP = 'editor.before_group'
    static GROUP = 'editor.group'

    static BEFORE_UNGROUP = 'editor.before_ungroup'
    static UNGROUP = 'editor.ungroup'

    static BEFORE_OPEN = 'editor.before_open_group'
    static OPEN = 'editor.open_group'

    static BEFORE_CLOSE = 'editor.before_close_group'
    static CLOSE = 'editor.close_group'

    readonly editTarget: IGroup

    constructor(type: string, data?: IEditorGroupEvent) {
        super(type, data)
    }

}