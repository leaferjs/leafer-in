import { IPointData } from '@leafer-ui/interface'
import { IEditorSkewEvent } from '@leafer-in/interface'

import { EditorEvent } from './EditorEvent'


export class EditorSkewEvent extends EditorEvent implements IEditorSkewEvent {

    static SKEW = 'editor.skew'

    // skewOf(origin, skewX, skewY)
    declare readonly origin: IPointData
    readonly skewX: number
    readonly skewY: number

    constructor(type: string, data?: IEditorSkewEvent) {
        super(type, data)
    }

}