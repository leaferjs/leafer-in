import { IAround, IDragEvent, IMatrixData } from '@leafer-ui/interface'

import { IEditorScaleEvent } from '@leafer-in/interface'
import { Direction9 } from '@leafer-ui/draw'

import { EditorEvent } from './EditorEvent'


export class EditorScaleEvent extends EditorEvent implements IEditorScaleEvent {

    static BEFORE_SCALE = 'editor.before_scale'
    static SCALE = 'editor.scale'

    // scaleOf(origin, scaleX, scaleY, resize)
    readonly scaleX: number
    readonly scaleY: number
    readonly transform?: IMatrixData

    readonly drag: IDragEvent

    readonly direction: Direction9
    readonly lockRatio: boolean
    readonly around: IAround

    constructor(type: string, data?: IEditorScaleEvent) {
        super(type, data)
    }

}