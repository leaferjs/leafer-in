import { IUI, IPointData, IAround, IDragEvent, IEvent, IEventListenerId, ILeafList, IMatrixData, IEditorBase } from '@leafer-ui/interface'
import { IEditBox } from './IEditBox'
import { IEditSelector } from './IEditSelector'


export interface IEditor extends IEditorBase {
    leafList: ILeafList

    targetSimulate: IUI

    selector: IEditSelector
    editBox: IEditBox
    editTool: IEditTool

    targetEventIds: IEventListenerId[]

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

