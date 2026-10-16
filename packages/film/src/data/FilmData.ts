import { IMultimediaType } from '@leafer-ui/interface'
import { ImageData } from '@leafer-ui/draw'


export class FilmData extends ImageData {

    public get __urlType(): IMultimediaType { return 'film' }

}