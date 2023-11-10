import { IAround, IDragEvent, IMatrixData } from '@leafer-ui/interface'
import { IDirection8, IEditResizeEvent } from '@leafer-in/interface'

import { EditEvent } from './EditEvent'

export class EditResizeEvent extends EditEvent implements IEditResizeEvent {

    static RESIZE = 'editor.resize'

    // scaleOf(origin, scaleX, scaleY, resize)
    readonly scaleX: number
    readonly scaleY: number
    readonly transform?: IMatrixData
    readonly resize: boolean

    readonly dragEvent: IDragEvent
    readonly direction: IDirection8

    readonly lockRatio: boolean
    readonly around: IAround

    constructor(type: string, data?: IEditResizeEvent) {
        super(type, data)
    }

}