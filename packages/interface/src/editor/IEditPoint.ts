import { IBox } from '@leafer-ui/interface'
import { IDirection8 } from './IEditor'

export interface IEditPoint extends IBox {
    direction: IDirection8
    pointType: IEditPointType
}

export type IEditPointType = 'rotate' | 'resize'