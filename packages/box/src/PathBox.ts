import { IPathBox, IPathBoxData, IPathBoxInputData, IStrokeAlign } from '@leafer-ui/interface'
import { registerUI, dataProcessor, affectStrokeBoundsType, Box } from '@leafer-ui/draw'

import { PathBoxData } from './data/PathBoxData'


@registerUI()
export class PathBox<TInputData = IPathBoxInputData> extends Box<TInputData> implements IPathBox {

    public get __tag() { return 'PathBox' }

    @dataProcessor(PathBoxData)
    declare public __: IPathBoxData

    @affectStrokeBoundsType('center')
    declare public strokeAlign?: IStrokeAlign

}