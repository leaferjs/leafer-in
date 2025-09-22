import { IMoveEvent, IZoomEvent, IRotateEvent, ITimer } from '@leafer-ui/interface'

import { InteractionBase, MoveEvent, ZoomEvent, RotateEvent } from '@leafer-ui/core'


let totalX: number, totalY: number, totalScale: number, totalRotation: number

export class Transformer {

    public get transforming(): boolean { return this.moving || this.zooming || this.rotating }
    public get moving(): boolean { return !!this.moveData }
    public get zooming(): boolean { return !!this.zoomData }
    public get rotating(): boolean { return !!this.rotateData }

    public moveData: IMoveEvent
    public zoomData: IZoomEvent
    public rotateData: IRotateEvent

    protected interaction: InteractionBase
    protected transformTimer: ITimer

    constructor(interaction: InteractionBase) {
        this.interaction = interaction
    }

    public move(data: IMoveEvent): void {
        const { interaction } = this
        if (!data.moveType) data.moveType = 'move'

        if (!this.moveData) {
            this.setPath(data)
            totalX = 0, totalY = 0
            this.moveData = { ...data, moveX: 0, moveY: 0, totalX, totalY }
            interaction.emit(MoveEvent.START, this.moveData)
        }

        data.path = this.moveData.path
        data.totalX = totalX = totalX + data.moveX
        data.totalY = totalY = totalY + data.moveY
        interaction.emit(MoveEvent.BEFORE_MOVE, data)
        interaction.emit(MoveEvent.MOVE, data)

        this.transformEndWait()
    }

    public zoom(data: IZoomEvent): void {
        const { interaction } = this

        if (!this.zoomData) {
            this.setPath(data)
            totalScale = 1
            this.zoomData = { ...data, scale: 1, totalScale }
            interaction.emit(ZoomEvent.START, this.zoomData)
        }

        data.path = this.zoomData.path
        data.totalScale = totalScale = totalScale * data.scale
        interaction.emit(ZoomEvent.BEFORE_ZOOM, data)
        interaction.emit(ZoomEvent.ZOOM, data)

        this.transformEndWait()
    }

    public rotate(data: IRotateEvent): void {
        const { interaction } = this

        if (!this.rotateData) {
            this.setPath(data)
            totalRotation = 0
            this.rotateData = { ...data, rotation: 0, totalRotation }
            interaction.emit(RotateEvent.START, this.rotateData)
        }

        data.path = this.rotateData.path
        data.totalRotation = totalRotation = totalRotation + data.rotation
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
        if (moveData) interaction.emit(MoveEvent.END, { ...moveData, totalX, totalY } as IMoveEvent)
        if (zoomData) interaction.emit(ZoomEvent.END, { ...zoomData, totalScale } as IZoomEvent)
        if (rotateData) interaction.emit(RotateEvent.END, { ...rotateData, totalRotation } as IRotateEvent)
        this.reset()
    }

    public reset(): void {
        this.zoomData = this.moveData = this.rotateData = null
    }

    public destroy(): void {
        this.reset()
    }
}