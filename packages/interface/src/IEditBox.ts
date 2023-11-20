import { IGroup, IRect, IBoundsData, IKeyEvent } from '@leafer-ui/interface'
import { IEditor } from '@leafer-in/interface'
import { IEditPoint } from './IEditPoint'

export interface IEditBox extends IGroup {

    editor: IEditor
    dragging?: boolean

    circle: IEditPoint
    rect: IRect

    resizePoints: IEditPoint[]
    rotatePoints: IEditPoint[]
    resizeLines: IEditPoint[]

    enterPoint: IEditPoint

    update(bounds: IBoundsData): void
    onArrow(e: IKeyEvent): void

}