import { IFilmFrame } from '@leafer-ui/interface'
import { Platform } from '@leafer-ui/draw'

import { GifReader } from 'omggif'

import { FilmDecoder } from './FilmDecoder'


export class OmgFilmDecoder extends FilmDecoder {

    public decoder: GifReader | any

    // 复用 RGBA buffer
    private decodeBuffer!: Uint8ClampedArray

    // 复用 ImageData（避免每帧 new）
    private sharedImageData!: ImageData

    // 只保留一个 restore 缓存（disposal=3）
    private restoreImageData: ImageData | null = null

    // --------------------------------------------------
    // 1️⃣ decodeHeader
    // --------------------------------------------------

    public async decodeHeader(data: ArrayBuffer): Promise<void> {
        const decoder = this.decoder = new GifReader(new Uint8Array(data))
        const { width, height } = decoder

        this.width = width
        this.height = height
        this.total = decoder.numFrames()
        this.loop = decoder.loopCount() || 0

        // 工作 canvas（永远只有一个）
        this.bufferCanvas = Platform.origin.createCanvas(width, height)
        this.bufferContext = this.bufferCanvas.getContext('2d')!

        // 复用 RGBA buffer
        this.decodeBuffer = new Uint8ClampedArray(width * height * 4)

        // 复用 ImageData
        this.sharedImageData = this.bufferContext.createImageData(width, height)

        this.createAtlas()

        // 首帧必须解
        await this.decodeFrame(0)
    }

    // --------------------------------------------------
    // 2️⃣ decodeFrame（顺序安全）
    // --------------------------------------------------

    public async decodeOneFrame(frameIndex: number): Promise<IFilmFrame> {
        const { decoder, decodeBuffer, bufferCanvas, bufferContext, sharedImageData } = this
        const info = decoder.frameInfo(frameIndex)

        // disposal=3 需要保存当前完整状态
        if (info.disposal === 3) this.restoreImageData = bufferContext.getImageData(0, 0, this.width, this.height)

        // 解码到 decodeBuffer
        decoder.decodeAndBlitFrameRGBA(frameIndex, decodeBuffer)

        // 复用 ImageData
        sharedImageData.data.set(decodeBuffer)

        // 绘制到 buffer
        bufferContext.putImageData(sharedImageData, 0, 0)

        let image: any

        if (this.atlas) {
            image = bufferCanvas
        } else {
            image = Platform.origin.createCanvas(this.width, this.height)
            const frameCtx = image.getContext('2d')!
            frameCtx.drawImage(bufferCanvas, 0, 0)
        }

        const frame: IFilmFrame = { image, duration: (info.delay || 10) / 100 }

        this.frames[frameIndex] = frame

        if (this.atlas) this.mergeFrame(frameIndex, false) // false 表示不物理销毁frame.image

        this.applyDisposal(info)

        return frame
    }

    // --------------------------------------------------
    // 3️⃣ disposal 处理
    // --------------------------------------------------

    private applyDisposal(info: any): void {
        const { bufferContext, restoreImageData } = this
        const disposal = info.disposal
        if (disposal === 2) {
            bufferContext.clearRect(info.x, info.y, info.width, info.height) // 恢复透明（当前帧区域）
        } else if (disposal === 3) {
            if (restoreImageData) {
                bufferContext.putImageData(restoreImageData, 0, 0)
                this.restoreImageData = null
            }
        }
    }

    // --------------------------------------------------
    // 5️⃣ destoryFrameImage
    // --------------------------------------------------

    public destoryFrameImage(frame: IFilmFrame): void {
        if (!frame.image) return

        const canvas = frame.image as HTMLCanvasElement

        // 强制释放 backing store
        canvas.width = 0
        canvas.height = 0

        delete frame.image
    }

    // --------------------------------------------------
    // 释放解码资源
    // --------------------------------------------------

    public destroyDecoder(): void {
        if (this.bufferCanvas) {
            this.bufferCanvas.width = 0
            this.bufferCanvas.height = 0

            this.decoder = null
            this.bufferCanvas = null
            this.bufferContext = null

            this.decodeBuffer = null
            this.sharedImageData = null
            this.restoreImageData = null
        }
    }
}