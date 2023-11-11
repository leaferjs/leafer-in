import { IAround, IDragEvent, IMatrixData } from '@leafer-ui/interface'
import { IDirection8, IEditResizeEvent as IEditScaleEvent } from '@leafer-in/interface'

import { EditEvent } from './EditEvent'

export class EditScaleEvent extends EditEvent implements IEditScaleEvent {

    static SCALE = 'editor.scale'

    // scaleOf(origin, scaleX, scaleY, resize)
    readonly scaleX: number
    readonly scaleY: number
    readonly transform?: IMatrixData
    readonly resize: boolean

    readonly dragEvent: IDragEvent
    readonly direction: IDirection8

    readonly lockRatio: boolean
    readonly around: IAround

    constructor(type: string, data?: IEditScaleEvent) {
        super(type, data)
    }

}