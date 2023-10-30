import { IGroup } from '@leafer-ui/interface'
import { IWireframe } from './IWireframe'

export interface IEditSelector extends IGroup {
    hoverWireframe: IWireframe
    targetWireframe: IWireframe
}