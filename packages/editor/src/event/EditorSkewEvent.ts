import { IEditorSkewEvent } from '@leafer-in/interface'

import { EditorEvent } from './EditorEvent'


export class EditorSkewEvent extends EditorEvent implements IEditorSkewEvent {

    static SKEW = 'editor.skew'

    // skewOf(origin, skewX, skewY)
    readonly skewX: number
    readonly skewY: number

    constructor(type: string, data?: IEditorSkewEvent) {
        super(type, data)
    }

}