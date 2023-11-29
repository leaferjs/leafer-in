import { IGroup, IBounds } from '@leafer-ui/interface'

import { IStroker } from './IStroker'
import { ISelectArea } from './ISelectArea'
import { IEditor } from './IEditor'

export interface IEditSelect extends IGroup {
    editor: IEditor

    dragging: boolean
    running: boolean

    hoverStroker: IStroker
    targetStroker: IStroker

    selectArea: ISelectArea
    bounds: IBounds

    update(): void
}