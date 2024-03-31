import { IUI, IPointData, IAround, IDragEvent, IEvent, IEventListenerId, ILeafList, IMatrixData, IEditorBase } from '@leafer-ui/interface'
import { IEditBox } from './IEditBox'
import { IEditSelect } from './IEditSelect'


export interface IEditor extends IEditorBase {
    leafList: ILeafList

    simulateTarget: IUI

    selector: IEditSelect
    editBox: IEditBox
    editTool: IEditTool

    targetEventIds: IEventListenerId[]

    listenTargetEvents(): void
    removeTargetEvents(): void
}

export interface IEditTool {
    tag: string
    onMove(e: IEditorMoveEvent): void
    onScale(e: IEditorScaleEvent): void
    onScaleWithDrag?(e: IEditorScaleEvent): void
    onRotate(e: IEditorRotateEvent): void
    onSkew(e: IEditorSkewEvent): void
    update(editor: IEditor): void
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

    readonly value?: IUI | IUI[]
    readonly oldValue?: IUI | IUI[]
    readonly list?: IUI[]
    readonly oldList?: IUI[]

    readonly worldOrigin?: IPointData
    readonly origin?: IPointData
}
export interface IEditorMoveEvent extends IEditorEvent {
    readonly moveX: number
    readonly moveY: number
}

export interface IEditorScaleEvent extends IEditorEvent {
    // scaleOf(origin, scaleX, scaleY, resize) / transform(transform, resize)
    readonly scaleX?: number
    readonly scaleY?: number
    transform?: IMatrixData

    readonly direction?: IDirection8
    readonly lockRatio?: boolean | 'corner'
    readonly around?: IAround

    drag?: IDragEvent
}

export interface IEditorRotateEvent extends IEditorEvent {
    // rotateOf(origin, rotation)
    transform?: IMatrixData
    readonly rotation?: number
}

export interface IEditorSkewEvent extends IEditorEvent {
    // skewOf(origin, skewX, skewY)
    transform?: IMatrixData
    readonly skewX?: number
    readonly skewY?: number
}

