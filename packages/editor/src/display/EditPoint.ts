import { IDirection8, IEditPoint, IEditPointType } from '@leafer-in/interface'
import { Rect } from '@leafer-ui/core'


export class EditPoint extends Rect implements IEditPoint {
    public direction: IDirection8
    public pointType: IEditPointType
}