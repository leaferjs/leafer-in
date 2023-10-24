import { IGroup, IUI, IRectInputData, IResizeType, IPolygon, ICursorType, IBoundsData, IPointData, IAround, IDragEvent, IEvent, IRect, IEventListenerId } from '@leafer-ui/interface'

export interface IEditor extends IGroup {
    config: IEditorConfig

    resizePoints: IUI[]
    rotatePoints: IUI[]
    resizeLines: IUI[]

    circle: IUI
    rect: IPolygon
    box: IRect

    target: IUI | IUI[]
    list: IUI[]

    simulateTarget: IUI

    tool: IEditorTool

    enterPoint: IUI

    __targetEventIds: IEventListenerId[]

    getTool(value: IUI | IUI[]): IEditorTool
    update(): void
}

export interface IEditorTool {
    name: string
    getMirrorData(editor: IEditor): IPointData
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

    stroke?: string
    pointFill?: string
    pointSize?: number
    pointRadius?: number

    point?: IRectInputData | IRectInputData[]
    rotatePoint?: IRectInputData
    rect?: IRectInputData

    hideOnMove?: boolean

    moveCursor?: ICursorType
    resizeCursor?: ICursorType[]
    rotateCursor?: ICursorType[]

    rotateable?: boolean
    resizeable?: boolean
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

export interface IEditorResizeEvent extends IEvent {
    readonly target?: IUI
    readonly editor?: IEditor

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

export interface IEditorRotateEvent extends IEvent {
    readonly target?: IUI
    readonly editor?: IEditor

    // rotateOf(origin, rotation)
    readonly origin?: IPointData
    readonly rotation?: number
}

export interface IEditorSkewEvent extends IEvent {
    readonly target?: IUI
    readonly editor?: IEditor

    // skewOf(origin, skewX, skewY)
    readonly origin?: IPointData
    readonly skewX?: number
    readonly skewY?: number
}