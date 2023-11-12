import { IGroup } from '@leafer-ui/interface'
import { IWireframe } from './IWireframe'

export interface IEditSelector extends IGroup {
    dragging: boolean
    hoverWireframe: IWireframe
    targetWireframe: IWireframe
}