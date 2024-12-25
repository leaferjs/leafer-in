import { IMoveEvent, IZoomEvent, IRotateEvent, ITimer } from '@leafer-ui/interface'

import { InteractionBase, MoveEvent, ZoomEvent, RotateEvent } from '@leafer-ui/core'


export class Transformer {

    public get transforming(): boolean { return !!(this.moveData || this.zoomData || this.rotateData) }

    protected interaction: InteractionBase
    protected moveData: IMoveEvent
    protected zoomData: IZoomEvent
    protected rotateData: IRotateEvent
    protected transformTimer: ITimer

    constructor(interaction: InteractionBase) {
        this.interaction = interaction
    }

    public move(data: IMoveEvent): void {
        const { interaction } = this
        if (!data.moveType) data.moveType = 'move'

        if (!this.moveData) {
            this.setPath(data)
            this.moveData = { ...data, moveX: 0, moveY: 0 }
            interaction.emit(MoveEvent.START, this.moveData)
        }

        data.path = this.moveData.path
        interaction.emit(MoveEvent.BEFORE_MOVE, data)
        interaction.emit(MoveEvent.MOVE, data)

        this.transformEndWait()
    }

    public zoom(data: IZoomEvent): void {
        const { interaction } = this

        if (!this.zoomData) {
            this.setPath(data)
            this.zoomData = { ...data, scale: 1 }
            interaction.emit(ZoomEvent.START, this.zoomData)
        }

        data.path = this.zoomData.path
        interaction.emit(ZoomEvent.BEFORE_ZOOM, data)
        interaction.emit(ZoomEvent.ZOOM, data)

        this.transformEndWait()
    }

    public rotate(data: IRotateEvent): void {
        const { interaction } = this

        if (!this.rotateData) {
            this.setPath(data)
            this.rotateData = { ...data, rotation: 0 }
            interaction.emit(RotateEvent.START, this.rotateData)
        }

        data.path = this.rotateData.path
        interaction.emit(RotateEvent.BEFORE_ROTATE, data)
        interaction.emit(RotateEvent.ROTATE, data)

        this.transformEndWait()
    }

    public setPath(data: any): void {
        const { interaction } = this
        const { path } = interaction.selector.getByPoint(data, interaction.hitRadius)
        data.path = path
        interaction.cancelHover()
    }

    protected transformEndWait(): void {
        clearTimeout(this.transformTimer)
        this.transformTimer = setTimeout(() => {
            this.transformEnd()
        }, this.interaction.p.transformTime)
    }

    public transformEnd(): void {
        const { interaction, moveData, zoomData, rotateData } = this
        if (moveData) interaction.emit(MoveEvent.END, moveData)
        if (zoomData) interaction.emit(ZoomEvent.END, zoomData)
        if (rotateData) interaction.emit(RotateEvent.END, rotateData)
        this.reset()
    }

    public reset(): void {
        this.zoomData = this.moveData = this.rotateData = null
    }

    public destroy(): void {
        this.reset()
    }
}