import { IStarBox, IStarBoxData, IStarBoxInputData, INumber } from '@leafer-ui/interface'
import { registerUI, dataProcessor, pathType, Star, rewrite, rewriteAble, Box } from '@leafer-ui/draw'

import { StarBoxData } from './data/StarBoxData'


const ellipse = Star.prototype

@rewriteAble()
@registerUI()
export class StarBox<TInputData = IStarBoxInputData> extends Box<TInputData> implements IStarBox {

    public get __tag() { return 'StarBox' }

    @pathType(5)
    public corners?: INumber

    @pathType(0.382)
    public innerRadius?: INumber

    @dataProcessor(StarBoxData)
    declare public __: IStarBoxData

    @rewrite(ellipse.__updatePath)
    public __updatePath(): void { }

}