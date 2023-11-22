import { IEditorMoveEvent } from '@leafer-in/interface'

import { EditorEvent } from './EditorEvent'


export class EditorMoveEvent extends EditorEvent implements IEditorMoveEvent {

    static MOVE = 'editor.move'

    readonly moveX: number
    readonly moveY: number

    constructor(type: string, data?: IEditorMoveEvent) {
        super(type, data)
    }

}