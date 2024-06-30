import { IFlow, IFlowData, IFlowInputData, IFlowType } from '@leafer-ui/interface'
import { registerUI, dataProcessor, Box, autoLayoutType } from '@leafer-ui/draw'

import { FlowData } from './data/FlowData'


@registerUI()
export class Flow extends Box implements IFlow {

    public get __tag() { return 'Flow' }

    @dataProcessor(FlowData)
    declare public __: IFlowData

    @autoLayoutType('x')
    declare public flow?: IFlowType

    constructor(data?: IFlowInputData) {
        super(data)
        this.__hasAutoLayout = true
    }

}