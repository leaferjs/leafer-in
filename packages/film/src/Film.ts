import { IFilm, IFilmInputData, IFilmData, } from '@leafer-ui/interface'
import { Image, registerUI, dataProcessor, useModule } from '@leafer-ui/draw'

import { FilmData } from './data/FilmData'
import { PaintFilm } from './PaintFilm'


@useModule(PaintFilm)
@registerUI()
export class Film<TInputData = IFilmInputData> extends Image<TInputData> implements IFilm {

    public get __tag() { return 'Film' }

    @dataProcessor(FilmData)
    declare public __: IFilmData
}

export interface Film {

    togglePlay(): void
    play(): void
    pause(): void
    stop(): void

    seekFrame(frameIndex: number): void

}