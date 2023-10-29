import { IGroup, IPolygon, IRect } from '@leafer-ui/interface'
import { IEditor } from '@leafer-in/interface'
import { IEditPoint } from './IEditPoint'

export interface IEditBox extends IGroup {

    editor: IEditor
    dragging?: boolean

    circle: IEditPoint
    rect: IPolygon
    targetRect: IRect

    resizePoints: IEditPoint[]
    rotatePoints: IEditPoint[]
    resizeLines: IEditPoint[]

    enterPoint: IEditPoint

}