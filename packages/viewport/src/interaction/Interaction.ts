import { IMoveEvent, IZoomEvent, IRotateEvent, IWheelEvent, IKeepTouchData, IPointData, IEvent, IPointerEvent } from '@leafer-ui/interface'

import { InteractionBase, PointHelper } from '@leafer-ui/core'

import { WheelEventHelper } from './WheelEventHelper'
import { Transformer } from './Transformer'
import { MultiTouchHelper } from './MultiTouchHelper'


function getMoveEventData(move: IPointData, event: IEvent): IMoveEvent {
    return { ...event, moveX: move.x, moveY: move.y } as IMoveEvent
}

function getRotateEventData(rotation: number, event: IEvent): IRotateEvent {
    return { ...event, rotation } as IRotateEvent
}

function getZoomEventData(scale: number, event: IEvent): IZoomEvent {
    return { ...event, scale, } as IZoomEvent
}


const interaction = InteractionBase.prototype

interaction.createTransformer = function (): void {
    this.transformer = new Transformer(this)
}

interaction.move = function (data: IMoveEvent): void {
    this.transformer.move(data)
}

interaction.zoom = function (data: IZoomEvent): void {
    this.transformer.zoom(data)
}

interaction.rotate = function (data: IRotateEvent): void {
    this.transformer.rotate(data)
}

interaction.transformEnd = function (): void {
    this.transformer.transformEnd()
}


interaction.wheel = function (data: IWheelEvent): void {
    const { wheel, pointer } = this.config, { posDeltaSpeed, negDeltaSpeed } = wheel
    if (wheel.disabled) return

    if (data.deltaX > 0) posDeltaSpeed && (data.deltaX *= posDeltaSpeed)
    else negDeltaSpeed && (data.deltaX *= negDeltaSpeed)

    if (data.deltaY > 0) posDeltaSpeed && (data.deltaY *= posDeltaSpeed)
    else negDeltaSpeed && (data.deltaY *= negDeltaSpeed)

    const scale = wheel.getScale ? wheel.getScale(data, wheel) : WheelEventHelper.getScale(data, wheel)
    if (scale !== 1) this.zoom(getZoomEventData(scale, data))
    else {
        const move = wheel.getMove ? wheel.getMove(data, wheel) : WheelEventHelper.getMove(data, wheel)
        if (pointer.snap) PointHelper.round(move)
        this.move(getMoveEventData(move, data))
    }
}


interaction.multiTouch = function (data: IPointerEvent, list: IKeepTouchData[]): void {
    if (this.config.multiTouch.disabled) return
    const { move, rotation, scale, center } = MultiTouchHelper.getData(list)

    Object.assign(data, center)
    data.multiTouch = true

    this.pointerWaitCancel()

    this.rotate(getRotateEventData(rotation, data))
    this.zoom(getZoomEventData(scale, data))
    this.move(getMoveEventData(move, data))
}