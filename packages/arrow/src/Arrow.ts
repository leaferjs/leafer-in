import { IArrow, IArrowData, IArrowInputData, IArrowType } from '@leafer-ui/interface'
import { Line, registerUI, strokeType, dataProcessor } from '@leafer-ui/draw'

import { ArrowData } from './data/ArrowData'


@registerUI()
export class Arrow extends Line implements IArrow {

    public get __tag() { return 'Arrow' }

    @dataProcessor(ArrowData)
    declare public __: IArrowData

    @strokeType('angle')
    declare public endArrow: IArrowType

    constructor(data?: IArrowInputData) {
        super(data)
        this.__.__useArrow = true
    }

}