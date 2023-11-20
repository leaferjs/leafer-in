import { IGroup, IUI, IRectInputData, IEditSize, ICursorType, IPointData, IAround, IDragEvent, IEvent, IEventListenerId, IRotateEvent, IStroke, IFill, ILeafList, IMatrixData, ILeaf } from '@leafer-ui/interface'
import { IEditBox } from './IEditBox'
import { IEditSelector } from './IEditSelector'


export interface IEditor extends IGroup {
    config: IEditorConfig

    hoverTarget: IUI
    target: IUI | IUI[] | ILeafList

    leafList: ILeafList
    readonly list: IUI[]

    readonly hasTarget: boolean
    readonly multiple: boolean
    readonly single: boolean

    element: IUI
    targetSimulate: IUI

    selector: IEditSelector
    editBox: IEditBox

    readonly dragging: boolean

    editTool: IEditTool

    targetEventIds: IEventListenerId[]

    hasItem(item: IUI): boolean
    shiftItem(item: IUI): void
    addItem(item: IUI): void
    removeItem(item: IUI): void

    update(): void
    updateEditTool(): void

    getEditSize(ui: ILeaf): IEditSize

    onMove(e: IDragEvent): void
    onScale(e: IDragEvent): void
    onRotate(e: IDragEvent | IRotateEvent): void
    onSkew(e: IDragEvent): void

    group(): void
    ungroup(): void

    lock(): void
    unlock(): void

    toTop(): void
    toBottom(): void

    listenTargetEvents(): void
    removeTargetEvents(): void
}

export interface IEditTool {
    tag: string
    scaleOfEvent: boolean
    getMirrorData(editor: IEditor): IPointData
    onMove(e: IEditMoveEvent): void
    onScale(e: IEditScaleEvent): void
    onRotate(e: IEditRotateEvent): void
    onSkew(e: IEditSkewEvent): void
    update(editor: IEditor): void
}

export interface IEditorConfig {
    type?: 'pc' | 'mobile'
    editSize?: 'auto' | IEditSize

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

    selector?: boolean
    selectBox?: IRectInputData

    hideOnMove?: boolean
    hideHover?: boolean

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

export interface IEditEvent extends IEvent {
    readonly target?: IUI
    readonly editor?: IEditor
    readonly worldOrigin?: IPointData
    readonly origin?: IPointData
}
export interface IEditMoveEvent extends IEditEvent {
    readonly moveX: number
    readonly moveY: number
}

export interface IEditScaleEvent extends IEditEvent {
    // scaleOf(origin, scaleX, scaleY, resize) / transform(transform, resize)
    transform?: IMatrixData

    readonly scaleX?: number
    readonly scaleY?: number
    readonly resize?: boolean

    dragEvent?: IDragEvent
    readonly direction?: IDirection8

    readonly lockRatio?: boolean
    readonly around?: IAround
}

export interface IEditRotateEvent extends IEditEvent {
    // rotateOf(origin, rotation)
    readonly rotation?: number
}

export interface IEditSkewEvent extends IEditEvent {
    // skewOf(origin, skewX, skewY)
    transform?: IMatrixData
    readonly skewX?: number
    readonly skewY?: number
}

