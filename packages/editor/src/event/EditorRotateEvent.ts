import { IUI, IPointData } from '@leafer-ui/interface'
import { IEditor, IEditorRotateEvent } from '@leafer-in/interface'

import { Event } from '@leafer-ui/core'


export class EditorRotateEvent extends Event implements IEditorRotateEvent {

    static ROTATE = 'editor.rotate'

    readonly target: IUI
    readonly editor: IEditor

    // rotateOf(origin, rotation)
    readonly origin: IPointData
    readonly rotation: number

    constructor(type: string, data?: IEditorRotateEvent) {
        super(type)
        if (data) Object.assign(this, data)
    }

}