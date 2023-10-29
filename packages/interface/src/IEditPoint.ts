import { IRect } from '@leafer-ui/interface'
import { IDirection8 } from './IEditor'

export interface IEditPoint extends IRect {
    direction: IDirection8
    pointType: IEditPointType
}

export type IEditPointType = 'rotate' | 'resize'