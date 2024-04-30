import { Box, Direction9 } from '@leafer-ui/draw'

import { IEditPoint, IEditPointType } from '@leafer-in/interface'


export class EditPoint extends Box implements IEditPoint {
    public direction: Direction9
    public pointType: IEditPointType
}