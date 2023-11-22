import { IUI, IPointData } from '@leafer-ui/interface'
import { Event } from '@leafer-ui/core'

import { IEditor, IEditorEvent } from '@leafer-in/interface'


export class EditorEvent extends Event implements IEditorEvent {

    static SELECT = 'editor.select'
    static HOVER = 'editor.hover'

    declare readonly target: IUI
    readonly editor: IEditor

    readonly worldOrigin: IPointData
    declare readonly origin: IPointData

    constructor(type: string, data?: IEditorEvent) {
        super(type)
        if (data) Object.assign(this, data)
    }

}