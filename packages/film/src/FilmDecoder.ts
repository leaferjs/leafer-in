import { isUndefined, Platform } from '@leafer-ui/draw'
import { ICanvasContext2D, IFilmDecoder, IFilmFileType, IFilmFrame, ILeaf, IPointData, IBooleanMap, IFilmPlayOptions } from '@leafer-ui/interface'


interface IFilmDecoderMap {
    [name: string]: { Decoder: any, force?: boolean }
}

export class FilmDecoder implements IFilmDecoder {

    public width: number // 宽度
    public height: number // 高度

    public total: number // 总的帧数
    public loop: number // 循环次数，为0表示无限循环

    public frames: IFilmFrame[] = [] // 帧数据
    public decodedIndex = -1 // 当前解码到第几帧

    public atlas?: any // 合并图
    public atlasContext?: ICanvasContext2D // 合并图的上下文手柄
    public atlasGrid?: IPointData // 横竖的排列数量

    public decoder: ImageDecoder // 解码器

    // 缓冲画布
    public bufferCanvas?: any
    public bufferContext?: ICanvasContext2D


    static decoderMap: IFilmDecoderMap = {}
    static supportMap: IBooleanMap = {}
    static maxAtlasSize = Platform.image.maxPatternSize

    static register(type: IFilmFileType, Decoder: any, force?: boolean): void {
        FilmDecoder.decoderMap[type] = { Decoder, force }
    }

    static async canUse(mimeType: string) {
        const { supportMap } = this
        let canUse = supportMap[mimeType]
        if (!isUndefined(canUse)) return canUse
        if (typeof ImageDecoder === 'undefined') return false
        canUse = await ImageDecoder.isTypeSupported(mimeType)
        return supportMap[mimeType] = canUse
    }


    public createAtlas(): void {
        const { width, height, total } = this
        if (width * height * total <= FilmDecoder.maxAtlasSize) {
            // 合并所有帧到一张大图里（画布能放下所有帧时）
            const columns = Math.ceil(Math.sqrt(total * height / width))
            const rows = Math.ceil(total / columns)
            this.atlasGrid = { x: columns, y: rows }
            this.atlas = Platform.origin.createCanvas(width * columns, height * rows)
            this.atlasContext = this.atlas.getContext('2d')
        }
    }

    public async decodeHeader(data: ArrayBuffer, type: string): Promise<void> {
        this.decoder = new ImageDecoder({ data, type })

        await this.decoder.tracks.ready
        const first = await this.decodeFrame(0)

        const { displayWidth, displayHeight } = first.image, { selectedTrack } = this.decoder.tracks
        this.width = displayWidth
        this.height = displayHeight
        this.total = selectedTrack.frameCount
        this.loop = selectedTrack.repetitionCount

        this.createAtlas()
        if (this.atlas) this.mergeFrame(0) // 因为已经读取了第一帧，存在合并图时，必须再次合并进去
    }

    public async decodeFrame(frameIndex: number): Promise<IFilmFrame> {
        const { frames } = this, frame = frames[frameIndex]
        if (frame && !frame.decoding) return frame

        // 必须顺序解码
        for (let i = this.decodedIndex + 1; i <= frameIndex; i++) {
            await this.decodeOneFrame(i)
            this.decodedIndex = i
        }

        return frames[frameIndex]
    }

    public async decodeOneFrame(frameIndex: number): Promise<IFilmFrame> {
        return new Promise((resolve) => {
            this.decoder.decode({ frameIndex }).then(result => {
                const { image } = result
                const frame: IFilmFrame = { image, duration: image.duration / 1000 / 1000 } // duration单位为秒
                this.frames[frameIndex] = frame
                if (this.atlas) this.mergeFrame(frameIndex)
                resolve(frame)
            })
        })
    }

    // 绘制当前帧到atlas合并图中
    public mergeFrame(frameIndex: number, destoryFrameImage: boolean = true): void {
        const frame = this.frames[frameIndex], { atlasGrid, width, height } = this
        frame.x = (frameIndex % atlasGrid.x) * width
        frame.y = Math.floor(frameIndex / atlasGrid.x) * height
        this.atlasContext.drawImage(frame.image, frame.x, frame.y)
        if (destoryFrameImage) this.destoryFrameImage(frame)
        else delete frame.image
    }

    public render(canvas: ICanvasContext2D, x: number, y: number, width: number, height: number, leaf: ILeaf, playOptions: IFilmPlayOptions, _imageScaleX: number, _imageScaleY: number): void {
        let { nowIndex, paused, speed, pauseIndex, loop, frameTimer } = playOptions

        if (isUndefined(nowIndex)) nowIndex = 0

        const { frames } = this, frame = frames[nowIndex]

        if (this.renderFrame(frame, canvas, x, y, width, height)) {

            if (frameTimer) return // 避免重复等待下一帧
            if (!isUndefined(pauseIndex) && nowIndex === pauseIndex) { // 播放到暂停帧为止
                playOptions.paused = true
                return
            }

            let nextIndex = nowIndex + 1

            if (nextIndex >= this.total) {
                if (this.loop && isFinite(this.loop)) { // 限制循环次数
                    loop = (loop as number || 0) + 1
                    if (loop > this.loop) return
                    playOptions.loop = loop
                }
                nextIndex = 0
            }

            if (nextIndex < this.total && !frames[nextIndex]) {
                frames[nextIndex] = { duration: 0, decoding: true } // 先占位，表示正在解码中
                this.decodeFrame(nextIndex).finally(() => {
                    if (this.decodedIndex === this.total - 1) this.destroyDecoder()
                })
            }

            if (paused) return

            playOptions.frameTimer = setTimeout(() => {

                playOptions.nowIndex = nextIndex
                delete playOptions.frameTimer
                leaf.forceRender()

            }, frame.duration * (speed || 1) * 1000)

        } else {

            this.renderFrame(frames[nowIndex - 1], canvas, x, y, width, height) // 暂时渲染上一帧顶替
            leaf.forceRender() // 防止停掉
        }
    }

    private renderFrame(frame: IFilmFrame, canvas: ICanvasContext2D, x: number, y: number, width: number, height: number): boolean {
        const canRender = frame && !frame.decoding, { atlas } = this
        if (canRender) {
            if (atlas) canvas.drawImage(atlas, frame.x, frame.y, this.width, this.height, x, y, width, height)
            else canvas.drawImage(frame.image, x, y, width, height)
        }
        return canRender
    }

    // 销毁单帧
    public destoryFrame(frameIndex: number, deleteIndex: boolean = true): void {
        const { frames } = this, frame = frames[frameIndex]
        if (frame) {
            this.destoryFrameImage(frame)
            if (deleteIndex) delete frames[frameIndex]
        }
    }

    // 销毁单帧内的VideoFrame或canvas对象
    public destoryFrameImage(frame: IFilmFrame): void {
        const { image } = frame
        if (image && image.close) image.close()
        delete frame.image
    }

    public destroyDecoder(): void {
        if (this.decoder) {
            this.decoder.close()
            this.decoder = null
        }
    }

    public close(): void {
        if (this.atlas) this.atlas = this.atlasContext = null
        this.frames.forEach((_item, index) => this.destoryFrame(index, false))
        this.frames.length = 0
        this.destroyDecoder()
    }

}
