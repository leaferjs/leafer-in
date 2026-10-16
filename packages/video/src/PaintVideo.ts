import { ILeafPaint, IVideoDecoder, IUI } from '@leafer-ui/interface'
import { isArray } from '@leafer-ui/draw'

export class PaintVideo {

    public element: IUI

    public get playerOptions(): ILeafPaint { const { fill } = (this.element || this as any).__; return isArray(fill) && fill.find(item => item.type === 'video') }

    public get decoder(): IVideoDecoder { const { playerOptions } = this; return playerOptions && playerOptions.image && playerOptions.image.view }

    public get duration(): number {    // 获取当前播放进度 (秒)
        const video = this.decoder
        return video && video.duration
    }

    public get currentTime(): number {    // 获取当前播放进度 (秒)
        const video = this.decoder
        return video && video.currentTime
    }

    public set currentTime(time: number) { // 设置播放进度
        const video = this.decoder
        if (video) {
            video.currentTime = time;
            (this.element || this as any as IUI).forceRender()// 需要强制更新一下元素
        }
    }

    public get volume(): number {   // 获取当前音量 (0 ~ 1)
        const video = this.decoder
        return video && video.volume
    }

    public set volume(volume: number) {    // 设置音量 (0 ~ 1)
        const video = this.decoder
        if (video) video.volume = volume
    }

    public get paused(): boolean {
        const video = this.decoder
        return video && video.paused
    }

    public get ended(): boolean {
        const video = this.decoder
        return video && video.ended
    }


    constructor(element: IUI) {
        this.element = element
    }


    public togglePlay(): void {
        const { playerOptions } = this
        if (playerOptions) {
            if (playerOptions.paused !== false) this.play()
            else this.pause()
        }
    }

    public play(): void {
        const { playerOptions } = this
        if (playerOptions && playerOptions.paused !== false) {
            playerOptions.paused = false;
            (this.element || this as any as IUI).forceRender()
        }
    }

    public pause(): void {
        const { playerOptions } = this
        if (playerOptions) {
            playerOptions.paused = true
            this.decoder.pause()
        }
    }

    public stop(): void {
        const { playerOptions } = this
        if (playerOptions) {
            playerOptions.nowIndex = 0
            this.currentTime = 0
            this.pause()
        }
    }
}
