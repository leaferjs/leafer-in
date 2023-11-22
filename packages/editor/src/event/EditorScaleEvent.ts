import { IAround, IDragEvent, IMatrixData } from '@leafer-ui/interface'

import { IDirection8, IEditorScaleEvent } from '@leafer-in/interface'

import { EditorEvent } from './EditorEvent'


export class EditorScaleEvent extends EditorEvent implements IEditorScaleEvent {

    static SCALE = 'editor.scale'

    // scaleOf(origin, scaleX, scaleY, resize)
    readonly scaleX: number
    readonly scaleY: number
    readonly transform?: IMatrixData

    readonly drag: IDragEvent

    readonly direction: IDirection8
    readonly lockRatio: boolean
    readonly around: IAround

    constructor(type: string, data?: IEditorScaleEvent) {
        super(type, data)
    }

}