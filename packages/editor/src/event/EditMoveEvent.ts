import { IEditMoveEvent } from '@leafer-in/interface'

import { EditEvent } from './EditEvent'


export class EditMoveEvent extends EditEvent implements IEditMoveEvent {

    static MOVE = 'editor.move'

    readonly moveX: number
    readonly moveY: number

    constructor(type: string, data?: IEditMoveEvent) {
        super(type, data)
    }

}