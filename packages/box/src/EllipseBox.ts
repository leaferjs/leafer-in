import { IEllipseBox, IEllipseBoxData, IEllipseBoxInputData, INumber } from '@leafer-ui/interface'
import { registerUI, dataProcessor, pathType, rewrite, rewriteAble, Ellipse, Box } from '@leafer-ui/draw'

import { EllipseBoxData } from './data/EllipseBoxData'


const ellipse = Ellipse.prototype

@rewriteAble()
@registerUI()
export class EllipseBox<TInputData = IEllipseBoxInputData> extends Box<TInputData> implements IEllipseBox {

    public get __tag() { return 'EllipseBox' }

    @dataProcessor(EllipseBoxData)
    declare public __: IEllipseBoxData

    @pathType(0)
    public innerRadius?: INumber

    @pathType(0)
    public startAngle?: INumber

    @pathType(0)
    public endAngle?: INumber

    @rewrite(ellipse.__updatePath)
    public __updatePath(): void { }

}