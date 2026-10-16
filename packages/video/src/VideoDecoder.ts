import { MathHelper } from '@leafer-ui/draw'
import { ICanvasContext2D, IVideoDecoder, IVideoFileType, ILeaf, IVideoPlayOptions } from '@leafer-ui/interface'


interface IVideoDecoderMap {
    [name: string]: { Decoder: any, force?: boolean }
}

export class VideoDecoder implements IVideoDecoder {

    public width: number // 宽度
    public height: number // 高度

    public duration: number

    public get currentTime(): number {    // 获取当前播放进度 (秒)
        const video = this.decoder
        return video.currentTime
    }

    public set currentTime(time: number) { // 设置播放进度
        const video = this.decoder
        const targetTime = MathHelper.within(time, 0, this.duration)
        video.currentTime = targetTime
    }

    public get volume(): number {   // 获取当前音量 (0 ~ 1)
        const video = this.decoder
        return video.volume
    }

    public set volume(volume: number) {    // 设置音量 (0 ~ 1)
        const video = this.decoder
        const targetVolume = MathHelper.within(volume, 0, 1)
        video.volume = targetVolume
        if (targetVolume > 0 && video.muted) video.muted = false         // 如果音量大于 0，确保解除静音状态
    }

    public get paused(): boolean {
        const video = this.decoder
        return video.paused
    }

    public get ended(): boolean {
        const video = this.decoder
        return video.ended
    }

    public loop: number // 循环次数，为0表示无限循环

    public decoder: HTMLVideoElement // 解码器

    // 缓冲画布
    public bufferCanvas?: any
    public bufferContext?: ICanvasContext2D

    static decoderMap: IVideoDecoderMap = {}

    static register(type: IVideoFileType, Decoder: any, force?: boolean): void {
        VideoDecoder.decoderMap[type] = { Decoder, force }
    }

    public load(): Promise<void> {
        return undefined
    }

    public play(): void {
        const video = this.decoder
        video.play()
    }

    public pause(): void {
        const video = this.decoder
        video.pause()
    }


    public render(canvas: ICanvasContext2D, x: number, y: number, width: number, height: number, leaf: ILeaf, playOptions: IVideoPlayOptions, _imageScaleX: number, _imageScaleY: number): void {
        let { paused } = playOptions

        const video = this.decoder
        if (video.ended) {
            video.pause()
            playOptions.paused = true
            playOptions.loop = (playOptions.loop as number || 0) + 1
        }

        if (paused === false && video.paused) {
            this.play()
        } else if (paused === true && !video.paused) {
            this.pause()
        } else {
            playOptions.paused = video.paused
        }

        // 仅在视频处于播放状态，且有实际数据更新时进行绘制
        canvas.drawImage(video, x, y, width, height)

        if (!video.paused) leaf.forceRender() // 防止停掉
    }


    public destroyDecoder(): void {
        const video = this.decoder
        if (video) {

            video.pause()
            video.src = ''
            video.load()
            this.decoder = null
        }
    }

    public close(): void {
        this.destroyDecoder()
    }

}
