import { IGroup, IRect, IBoundsData, IKeyEvent } from '@leafer-ui/interface'
import { IEditor } from '@leafer-in/interface'
import { IEditPoint } from './IEditPoint'

export interface IEditBox extends IGroup {

    editor: IEditor
    dragging?: boolean

    circle: IEditPoint
    rect: IRect

    buttons: IGroup

    resizePoints: IEditPoint[]
    rotatePoints: IEditPoint[]
    resizeLines: IEditPoint[]

    readonly flipped: boolean
    readonly flippedX: boolean
    readonly flippedY: boolean
    readonly flippedOne: boolean

    enterPoint: IEditPoint

    update(bounds: IBoundsData): void
    onArrow(e: IKeyEvent): void

}