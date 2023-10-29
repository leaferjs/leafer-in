import { IPointData } from '@leafer-ui/interface'
import { IEditorRotateEvent } from '@leafer-in/interface'

import { EditorEvent } from './EditorEvent'


export class EditorRotateEvent extends EditorEvent implements IEditorRotateEvent {

    static ROTATE = 'editor.rotate'

    // rotateOf(origin, rotation)
    declare readonly origin: IPointData
    readonly rotation: number

    constructor(type: string, data?: IEditorRotateEvent) {
        super(type, data)
    }

}