import { IGroup, IBounds } from '@leafer-ui/interface'

import { IStroker } from './IStroker'
import { ISelectBox } from './ISelectBox'
import { IEditor } from './IEditor'

export interface IEditSelector extends IGroup {
    editor: IEditor

    dragging: boolean
    running: boolean

    hoverStroker: IStroker
    targetStroker: IStroker

    selectBox: ISelectBox
    bounds: IBounds
}