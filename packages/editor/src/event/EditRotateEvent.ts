import { IEditRotateEvent } from '@leafer-in/interface'

import { EditEvent } from './EditEvent'


export class EditRotateEvent extends EditEvent implements IEditRotateEvent {

    static ROTATE = 'editor.rotate'

    // rotateOf(origin, rotation)
    readonly rotation: number

    constructor(type: string, data?: IEditRotateEvent) {
        super(type, data)
    }

}