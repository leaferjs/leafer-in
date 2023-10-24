import { IUI, IPointData } from '@leafer-ui/interface'
import { IEditor, IEditorSkewEvent } from '@leafer-in/interface'

import { Event } from '@leafer-ui/core'


export class EditorSkewEvent extends Event implements IEditorSkewEvent {

    static SKEW = 'editor.skew'

    declare readonly target: IUI
    readonly editor: IEditor

    // skewOf(origin, skewX, skewY)
    declare readonly origin: IPointData
    readonly skewX: number
    readonly skewY: number

    constructor(type: string, data?: IEditorSkewEvent) {
        super(type)
        if (data) Object.assign(this, data)
    }

}