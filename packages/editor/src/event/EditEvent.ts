import { IUI, IPointData } from '@leafer-ui/interface'
import { Event } from '@leafer-ui/core'

import { IEditor, IEditEvent } from '@leafer-in/interface'


export class EditEvent extends Event implements IEditEvent {

    static SELECT = 'editor.select'
    static HOVER = 'editor.hover'

    declare readonly target: IUI
    readonly editor: IEditor

    readonly worldOrigin: IPointData
    declare readonly origin: IPointData

    constructor(type: string, data?: IEditEvent) {
        super(type)
        if (data) Object.assign(this, data)
    }

}