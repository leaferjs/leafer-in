import { IImageBoxData, IImageInputData, IImage, IObject, IJSONOptions, IMultimediaType } from '@leafer-ui/interface'
import { BoxData } from '@leafer-ui/draw'


export class ImageBoxData extends BoxData implements IImageBoxData {
    declare public __leaf: IImage

    public get __urlType(): IMultimediaType { return 'image' }

    protected _url: string

    protected setUrl(value: string) {
        this.__setImageFill(value)
        this._url = value
    }

    public __setImageFill(value: string): void {
        (this as IImageInputData).fill = value ? { type: this.__urlType, mode: 'stretch', url: value } : undefined
    }

    public __getData(): IObject {
        const data: IImageInputData = super.__getData()
        if (data.url) delete data.fill
        return data
    }

    public __getInputData(names?: string[] | IObject, options?: IJSONOptions): IObject {
        const data: IImageInputData = super.__getInputData(names, options)
        if (data.url) delete data.fill
        return data
    }
}
