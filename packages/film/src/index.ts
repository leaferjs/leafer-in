import { LeaferFilm, Platform, Creator, FileHelper, PaintImage, Resource, Plugin, isObject } from '@leafer-ui/draw'
import { ILeaferFilm, ILeaferFilmConfig, IImageCrossOrigin, ILeaf, IFilmDecoder, ILeafPaint, IFilmFileType } from '@leafer-ui/interface'

import { FilmDecoder } from './FilmDecoder'
import { OmgFilmDecoder } from './OmgFilmDecoder'
import { getFileExt } from './helper/ext'

export { Film } from './Film'
export { FilmData } from './data/FilmData'
export { FilmDecoder } from './FilmDecoder'
export { PaintFilm } from './PaintFilm'


Plugin.add('flim')


PaintImage.film = function (paint: ILeafPaint, oldPaint?: ILeafPaint): void {
    paint.film = true
    paint.nowIndex = 0
    if (isObject(oldPaint)) {
        paint.nowIndex = oldPaint.nowIndex
        paint.pauseIndex = oldPaint.pauseIndex
        paint.speed = oldPaint.speed
        paint.paused = oldPaint.paused
        paint.loop = oldPaint.loop
    }
}

Creator.film = function (options?: ILeaferFilmConfig): ILeaferFilm {
    return new LeaferFilm(options)
}

Resource.loadFilm = function (key: string, format?: IFilmFileType): Promise<ILeaferFilm> {
    return new Promise((resolve, reject) => {
        const config: ILeaferFilmConfig = { url: key }
        if (format) config.format = format
        const film = Creator.film(config)
        Resource.set(key, film)
        film.load(() => resolve(film), (e: any) => reject(e))
    })
}

LeaferFilm.prototype.render = function (canvas: any, x: number, y: number, width: number, height: number, leaf: ILeaf, paint: any, imageScaleX: number, imageScaleY: number): void {
    this.view.render(canvas, x, y, width, height, leaf, paint, imageScaleX, imageScaleY)
}

FilmDecoder.register('gif', OmgFilmDecoder) //  OmgFilmDecoder

Platform.origin.loadFilm = async function (url: string, _crossOrigin?: IImageCrossOrigin, leaferFilm?: ILeaferFilm): Promise<any> {
    const buffer = await Platform.origin.loadContent(url, 'arrayBuffer')

    let ext = getFileExt(url)   // 获取文件后缀名

    if (!ext) {
        if (leaferFilm) ext = leaferFilm.config.format
        if (!ext) ext = 'gif'
    }

    const mimeType = FileHelper.mimeType(ext)
    const canUseFilmDecoder = await FilmDecoder.canUse(mimeType)

    let Decoder: any
    const tool = FilmDecoder.decoderMap[ext]

    if (!tool || (canUseFilmDecoder && !tool.force)) Decoder = FilmDecoder
    else Decoder = tool.Decoder

    if (!Decoder) throw new Error('no decoder: ' + mimeType)

    const decoder: IFilmDecoder = new Decoder()
    await decoder.decodeHeader(buffer, mimeType)

    return decoder
}

