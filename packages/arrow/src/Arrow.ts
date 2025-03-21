import { IArrow, IArrowData, IArrowInputData, IArrowType } from '@leafer-ui/interface'
import { Line, registerUI, dataProcessor } from '@leafer-ui/draw'

import { ArrowData } from './data/ArrowData'
import { arrowType } from './decorator'


@registerUI()
export class Arrow extends Line implements IArrow {

    public get __tag() { return 'Arrow' }

    @dataProcessor(ArrowData)
    declare public __: IArrowData

    @arrowType('angle')
    declare public endArrow?: IArrowType

    constructor(data?: IArrowInputData) {
        super(data)
        this.__.__useArrow = true
    }

}