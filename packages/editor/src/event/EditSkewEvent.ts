import { IPointData } from '@leafer-ui/interface'

import { IEditSkewEvent } from '@leafer-in/interface'

import { EditEvent } from './EditEvent'


export class EditSkewEvent extends EditEvent implements IEditSkewEvent {

    static SKEW = 'editor.skew'

    // skewOf(origin, skewX, skewY)
    readonly targetOrigin: IPointData
    readonly skewX: number
    readonly skewY: number

    constructor(type: string, data?: IEditSkewEvent) {
        super(type, data)
    }

}