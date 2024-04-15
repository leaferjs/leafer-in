import { Box } from '@leafer-ui/draw'

import { IDirection8, IEditPoint, IEditPointType } from '@leafer-in/interface'


export class EditPoint extends Box implements IEditPoint {
    public direction: IDirection8
    public pointType: IEditPointType
}