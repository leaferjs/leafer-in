import { LeaferVideo, Platform, Creator, PaintImage, Resource, Plugin } from '@leafer-ui/draw'
import { ILeaferVideo, ILeaferVideoConfig, IImageCrossOrigin, ILeaf, ILeafPaint, IVideoFileType } from '@leafer-ui/interface'

import { VideoDecoder } from './VideoDecoder'

export { Video } from './Video'
export { VideoData } from './data/VideoData'
export { VideoDecoder } from './VideoDecoder'
export { PaintVideo } from './PaintVideo'

//feat(video): 开源video插件
Plugin.add('video')


PaintImage.video = function (paint: ILeafPaint): void {
    paint.film = true
    paint.nowIndex = 0
}

Creator.video = function (options?: ILeaferVideoConfig): ILeaferVideo {
    return new LeaferVideo(options)
}

Resource.loadVideo = function (key: string, format?: IVideoFileType): Promise<ILeaferVideo> {
    return new Promise((resolve, reject) => {
        const config: ILeaferVideoConfig = { url: key }
        if (format) config.format = format
        const video = Creator.video(config)
        Resource.set(key, video)
        video.load(() => resolve(video), (e: any) => reject(e))
    })
}

LeaferVideo.prototype.render = function (canvas: any, x: number, y: number, width: number, height: number, leaf: ILeaf, paint: any, imageScaleX: number, imageScaleY: number): void {
    this.view.render(canvas, x, y, width, height, leaf, paint, imageScaleX, imageScaleY)
}


Platform.origin.loadVideo = async function (url: string, _crossOrigin?: IImageCrossOrigin, _leaferVideo?: ILeaferVideo): Promise<any> {
    //const buffer = await Platform.origin.loadContent(url, 'arrayBuffer')

    // let ext = getFileExt(url)   // 获取文件后缀名

    // if (!ext) {
    //     if (leaferVideo) ext = leaferVideo.config.format
    //     if (!ext) ext = 'gif'
    // }

    // const mimeType = FileHelper.mimeType(ext)
    const video = createVideoElement(url)

    const decoder = new VideoDecoder()

    const { width, height, duration } = await waitVideoMetadata(video)
    decoder.decoder = video
    decoder.width = width
    decoder.height = height
    decoder.duration = duration

    // await waitCanPlayReady(video)
    await waitVideoFrameReady(video)

    return decoder
}

/**
 * 创建并配置一个隐藏的 HTMLVideoElement
 */
function createVideoElement(url: string, muted = false, loop = false): HTMLVideoElement {
    const video = document.createElement('video')
    video.src = url
    video.muted = muted
    video.loop = loop

    // 必须设置 playsInline 保证在移动端浏览器内联播放，而不是弹窗全屏
    video.playsInline = true
    //video.webkitPlaysInline = true

    // 允许跨域（如果视频托管在 CDN，Canvas 绘制需要此属性避免 Canvas 污染/报错）
    video.crossOrigin = 'anonymous'

    return video
}

/**
 * 等待视频元数据加载完毕，返回视频的尺寸与时长信息
 */
function waitVideoMetadata(video: HTMLVideoElement): Promise<{ width: number; height: number; duration: number }> {
    return new Promise((resolve) => {
        if (video.readyState >= 1) { // HAVE_METADATA 及以上
            resolve({
                width: video.videoWidth,
                height: video.videoHeight,
                duration: video.duration
            })
        } else {
            video.addEventListener('loadedmetadata', () => {
                resolve({
                    width: video.videoWidth,
                    height: video.videoHeight,
                    duration: video.duration
                })
            }, { once: true })
        }
    })
}

/**
 * 等待视频首帧可绘制到 Canvas
 */
export function waitVideoFrameReady(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
        if ('requestVideoFrameCallback' in video) {
            video.requestVideoFrameCallback(() => resolve())
            return
        }

        if ((video as any).readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            resolve()
            return
        }

        (video as any).addEventListener('loadeddata', () => resolve(), {
            once: true
        })
    })
}