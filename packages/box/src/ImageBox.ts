import { IImageBox, IImageBoxData, IImageBoxInputData, IString, ILeaferImage } from '@leafer-ui/interface'
import { registerUI, dataProcessor, boundsType, isArray, Box } from '@leafer-ui/draw'

import { ImageBoxData } from './data/ImageBoxData'


@registerUI()
export class ImageBox<TInputData = IImageBoxInputData> extends Box<TInputData> implements IImageBox {

    public get __tag() { return 'ImageBox' }

    @dataProcessor(ImageBoxData)
    declare public __: IImageBoxData

    @boundsType('')
    public url: IString

    public get ready(): boolean { const { image } = this; return image && image.ready }

    public get image(): ILeaferImage { const { fill } = this.__; return isArray(fill) && fill[0].image }

    public get __useSelfBox() { return true }

}