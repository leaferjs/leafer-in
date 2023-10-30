import { IGroup, IUI, IRectInputData, IResizeType, ICursorType, IBoundsData, IPointData, IAround, IDragEvent, IEvent, IEventListenerId, IRotateEvent, IStroke, IFill, ILeafList, ILeaferBase } from '@leafer-ui/interface'
import { IEditBox } from './IEditBox'
import { IEditSelector } from './IEditSelector'

export interface IEditor extends IGroup {
    config: IEditorConfig

    hoverTarget: IUI
    target: IUI | IUI[] | ILeafList

    targetList: ILeafList
    readonly multiple: boolean

    targetSimulate: IUI
    targetLeafer: ILeaferBase

    selector: IEditSelector
    box: IEditBox

    tool: IEditorTool

    targetEventIds: IEventListenerId[]

    hasItem(item: IUI): void
    shiftItem(item: IUI): void
    addItem(item: IUI): void
    removeItem(item: IUI): void

    getTool(value: IUI | IUI[]): IEditorTool
    update(): void

    onMove(e: IDragEvent): void
    onResize(e: IDragEvent): void
    onRotate(e: IDragEvent | IRotateEvent): void
    onSkew(e: IDragEvent): void
}

export interface IEditorTool {
    name: string
    getMirrorData(editor: IEditor): IPointData
    move(e: IEditorMoveEvent): void
    resize(e: IEditorResizeEvent): void
    rotate(e: IEditorRotateEvent): void
    skew(e: IEditorSkewEvent): void
    update(editor: IEditor): void
}

export interface IEditorConfig {
    type?: 'pc' | 'mobile'
    resizeType?: 'auto' | IResizeType

    around?: IAround
    lockRatio?: boolean
    rotateGap?: number

    stroke?: IStroke
    strokeWidth?: number

    pointFill?: IFill
    pointSize?: number
    pointRadius?: number

    point?: IRectInputData | IRectInputData[]
    rotatePoint?: IRectInputData
    rect?: IRectInputData
    selectArea?: IRectInputData

    hideOnMove?: boolean

    moveCursor?: ICursorType
    resizeCursor?: ICursorType[]
    rotateCursor?: ICursorType[]

    rotateable?: boolean
    resizeable?: boolean
    skewable?: boolean
}

export enum IDirection8 {
    topLeft,
    top,
    topRight,
    right,
    bottomRight,
    bottom,
    bottomLeft,
    left
}

export interface IEditorEvent extends IEvent {
    readonly target?: IUI
    readonly editor?: IEditor
}
export interface IEditorMoveEvent extends IEditorEvent {
    readonly moveX: number
    readonly moveY: number
}

export interface IEditorResizeEvent extends IEditorEvent {
    readonly resizeType?: IResizeType
    readonly lockRatio?: boolean
    readonly around?: IAround

    readonly dragEvent?: IDragEvent
    readonly direction?: IDirection8

    // from old to bounds
    readonly bounds?: IBoundsData
    readonly old?: IBoundsData

    // scaleOf(origin, scaleX, scaleY)
    readonly origin?: IPointData
    readonly scaleX?: number
    readonly scaleY?: number
}

export interface IEditorRotateEvent extends IEditorEvent {
    // rotateOf(origin, rotation)
    readonly origin?: IPointData
    readonly rotation?: number
}

export interface IEditorSkewEvent extends IEditorEvent {
    // skewOf(origin, skewX, skewY)
    readonly origin?: IPointData
    readonly skewX?: number
    readonly skewY?: number
}

