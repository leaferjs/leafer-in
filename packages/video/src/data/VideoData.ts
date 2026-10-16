import { IMultimediaType } from '@leafer-ui/interface'
import { ImageData } from '@leafer-ui/draw'


export class VideoData extends ImageData {

    public get __urlType(): IMultimediaType { return 'video' }

}