import { IDirection8, IEditPoint, IEditPointType } from '@leafer-in/interface'
import { Box } from '@leafer-ui/core'


export class EditPoint extends Box implements IEditPoint {
    public direction: IDirection8
    public pointType: IEditPointType
}