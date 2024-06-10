import { IInnerEditorEvent, IInnerEditor } from '@leafer-in/interface'

import { EditorEvent } from './EditorEvent'
import { IUI } from '@leafer-ui/interface'
import { } from '../tool/InnerEditor'


export class InnerEditorEvent extends EditorEvent implements IInnerEditorEvent {

    static BEFORE_OPEN = 'innerEditor.before_open'
    static OPEN = 'innerEditor.open'

    static BEFORE_CLOSE = 'innerEditor.before_close'
    static CLOSE = 'innerEditor.close'

    readonly editTarget: IUI
    readonly innerEditor: IInnerEditor

    constructor(type: string, data?: IInnerEditorEvent) {
        super(type, data)
    }

}