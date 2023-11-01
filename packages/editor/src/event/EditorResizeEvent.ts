import { IPointData, IAround, IDragEvent } from '@leafer-ui/interface'
import { IDirection8, IEditorResizeEvent } from '@leafer-in/interface'

import { EditorEvent } from './EditorEvent'

export class EditorResizeEvent extends EditorEvent implements IEditorResizeEvent {

    static RESIZE = 'editor.resize'

    // scaleOf(origin, scaleX, scaleY, resize)
    readonly targetOrigin: IPointData
    readonly scaleX: number
    readonly scaleY: number
    readonly resize: boolean

    readonly dragEvent: IDragEvent
    readonly direction: IDirection8

    readonly lockRatio: boolean
    readonly around: IAround

    constructor(type: string, data?: IEditorResizeEvent) {
        super(type, data)
    }

}