import { IResizeType, IBoundsData, IPointData, IAround, IDragEvent } from '@leafer-ui/interface'
import { IDirection8, IEditorResizeEvent } from '@leafer-in/interface'

import { EditorEvent } from './EditorEvent'

export class EditorResizeEvent extends EditorEvent implements IEditorResizeEvent {

    static RESIZE = 'editor.resize'

    readonly resizeType: IResizeType
    readonly lockRatio: boolean
    readonly around: IAround

    readonly dragEvent: IDragEvent
    readonly direction: IDirection8

    // from old to bounds
    readonly bounds: IBoundsData
    readonly old: IBoundsData

    // scaleOf(origin, scaleX, scaleY)
    declare readonly origin: IPointData
    readonly scaleX: number
    readonly scaleY: number

    constructor(type: string, data?: IEditorResizeEvent) {
        super(type, data)
    }

}