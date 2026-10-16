import { ILeafPaint, IFilmDecoder, IUI } from '@leafer-ui/interface'
import { isArray } from '@leafer-ui/draw'

export class PaintFilm {

    public element: IUI

    public get playerOptions(): ILeafPaint { const { fill } = (this.element || this as any).__; return isArray(fill) && fill.find(item => item.type === 'film') }

    public get decoder(): IFilmDecoder { const { playerOptions } = this; return playerOptions && playerOptions.image && playerOptions.image.view }


    constructor(element: IUI) {
        this.element = element
    }


    public togglePlay(): void {
        const { playerOptions } = this
        if (playerOptions) {
            if (playerOptions.paused) this.play()
            else this.pause()
        }
    }

    public play(): void {
        const { playerOptions } = this
        if (playerOptions && playerOptions.paused) {
            delete playerOptions.paused;
            (this.element || this as any).forceRender()
        }
    }

    public pause(): void {
        const { playerOptions } = this
        if (playerOptions) playerOptions.paused = true
    }

    public stop(): void {
        const { playerOptions } = this
        if (playerOptions) {
            delete playerOptions.frameTime
            playerOptions.nowIndex = 0
            this.pause()
        }
    }

    public seekFrame(frameIndex: number): void {
        const { playerOptions } = this
        if (playerOptions) {
            playerOptions.nowIndex = frameIndex;
            (this.element || this as any).forceRender()
        }
    }

}