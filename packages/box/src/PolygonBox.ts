import { IPolygonBox, IPolygonBoxData, IPolygonBoxInputData, INumber, IPointData } from '@leafer-ui/interface'
import { registerUI, dataProcessor, pathType, rewrite, rewriteAble, Polygon, Box } from '@leafer-ui/draw'

import { PolygonBoxData } from './data/PolygonBoxData'


const polygon = Polygon.prototype

@rewriteAble()
@registerUI()
export class PolygonBox<TInputData = IPolygonBoxInputData> extends Box<TInputData> implements IPolygonBox {

    public get __tag() { return 'PolygonBox' }

    @dataProcessor(PolygonBoxData)
    declare public __: IPolygonBoxData

    @pathType(3)
    public sides?: INumber

    @pathType()
    public points?: number[] | IPointData[]

    @pathType(0)
    public curve?: boolean | number

    @rewrite(polygon.__updatePath)
    public __updatePath(): void { }

}