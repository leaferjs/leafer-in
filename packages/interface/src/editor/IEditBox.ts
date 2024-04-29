import { IGroup, IRect, IBoundsData, IKeyEvent, IBoxInputData } from '@leafer-ui/interface'
import { IEditor } from './IEditor'
import { IEditPoint } from './IEditPoint'

export interface IEditBox extends IGroup {

    editor: IEditor
    dragging: boolean
    moving: boolean

    view: IGroup //  放置默认编辑工具控制点

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

    getPointStyle(userStyle?: IBoxInputData): IBoxInputData
    getPointsStyle(): IBoxInputData[]
    getMiddlePointsStyle(): IBoxInputData[]

    load(): void
    update(bounds: IBoundsData): void
    unload(): void

    onArrow(e: IKeyEvent): void

}