import { IUI, IResizeType, IBoundsData, IPointData, IAround, IDragEvent } from '@leafer-ui/interface'
import { IEditor, IDirection8, IEditorResizeEvent } from '@leafer-in/interface'

import { Event } from '@leafer-ui/core'

export class EditorResizeEvent extends Event implements IEditorResizeEvent {

    static RESIZE = 'editor.resize'

    declare readonly target: IUI
    readonly editor: IEditor

    readonly resizeType: IResizeType
    readonly lockRatio: boolean
    readonly around: IAround

    readonly dragEvent: IDragEvent
    readonly direction: IDirection8

    // from old to bounds
    readonly bounds: IBoundsData
    readonly old: IBoundsData

    // scaleOf(origin, scaleX, scaleY)
    readonly origin: IPointData
    readonly scaleX: number
    readonly scaleY: number

    constructor(type: string, data?: IEditorResizeEvent) {
        super(type)
        if (data) Object.assign(this, data)
    }

}