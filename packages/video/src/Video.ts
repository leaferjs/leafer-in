import { IVideo, IVideoInputData, IVideoData, IVideoDecoder, ILeafPaint } from '@leafer-ui/interface'
import { Image, registerUI, dataProcessor, useModule } from '@leafer-ui/draw'

import { VideoData } from './data/VideoData'
import { PaintVideo } from './PaintVideo'


@useModule(PaintVideo)
@registerUI()
export class Video<TInputData = IVideoInputData> extends Image<TInputData> implements IVideo {

    public get __tag() { return 'Video' }

    @dataProcessor(VideoData)
    declare public __: IVideoData

    public autoplay?: boolean

    public muted?: boolean

    public loop?: boolean
}

export interface Video {

    readonly playerOptions: ILeafPaint
    readonly decoder: IVideoDecoder

    duration: number // 总时长
    currentTime: number // 当前播放进度 (秒)
    volume: number // 音量 0 ~1 

    readonly paused: boolean
    readonly ended: boolean // 是否播放结束

    togglePlay(): void
    play(): void
    pause(): void
    stop(): void
}