import { IUI, IPointData, IAround, IDragEvent, IEvent, IEventListenerId, IMatrixData, IEditorBase, IGroup, IObject } from '@leafer-ui/interface'

import { IEditBox } from './IEditBox'
import { IEditSelect } from './IEditSelect'
import { ISimulateElement } from './ISimulateTarget'


export interface IEditor extends IEditorBase {
    simulateTarget: ISimulateElement

    selector: IEditSelect
    editBox: IEditBox
    editTool?: IEditTool
    innerEditor?: IInnerEditor

    targetEventIds: IEventListenerId[]

    checkOpenedGroups(): void

    listenTargetEvents(): void
    removeTargetEvents(): void
}

export interface IEditTool extends IInnerEditor {
    // 操作
    onMove(e: IEditorMoveEvent): void
    onScale(e: IEditorScaleEvent): void
    onScaleWithDrag?(e: IEditorScaleEvent): void
    onRotate(e: IEditorRotateEvent): void
    onSkew(e: IEditorSkewEvent): void
}

export interface IInnerEditor {
    readonly tag: string
    readonly mode: IInnerEditorMode
    editTarget: IUI
    config: IObject

    editor: IEditor
    editBox: IEditBox
    view: IGroup

    eventIds: IEventListenerId[]

    onCreate(): void
    create(): void

    // 状态
    onLoad(): void
    load(): void

    onLoad(): void
    unload(): void

    onUpdate(): void
    update(): void

    onDestroy(): void
    destroy(): void
}

export type IInnerEditorMode = 'focus' | 'both'

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

export interface IInnerEditorEvent extends IEditorEvent {
    editTarget: IUI
    innerEditor: IInnerEditor
}

export interface IEditorGroupEvent extends IEditorEvent {
    editTarget: IGroup
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

    readonly direction?: number
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

