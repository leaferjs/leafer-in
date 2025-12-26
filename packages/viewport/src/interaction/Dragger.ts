import { IPointerEvent, IFunction, IDragEvent } from '@leafer-ui/interface'

import { Dragger, BoundsHelper, PointHelper, MoveEvent, isNumber } from '@leafer-ui/core'


const dragger = Dragger.prototype
const { abs, min, max, hypot } = Math

dragger.checkDragEndAnimate = function (data: IPointerEvent): boolean | number {
    const { interaction } = this
    const dragAnimate = this.canAnimate && this.moving && interaction.m.dragAnimate

    if (dragAnimate) {

        const inertia = isNumber(dragAnimate) ? dragAnimate : 0.95
        const stopMove = 0.15
        const maxMove = 150

        let moveX = 0, moveY = 0, flickSpeed = 0 // 快速滑动加速
        let totalWeight = 0, weight: number, w = 3, s: number, frame: IDragEvent

        const { dragDataList } = this, len = dragDataList.length
        for (let i = len - 1; i >= max(len - 3, 0); i--) {
            frame = dragDataList[i]
            if (frame.time && (Date.now() - frame.time > 100)) break
            weight = w--

            moveX += frame.moveX * weight
            moveY += frame.moveY * weight
            totalWeight += weight

            s = hypot(frame.moveX, frame.moveY)
            if (s > flickSpeed) flickSpeed = s
        }

        if (totalWeight) moveX /= totalWeight, moveY /= totalWeight

        if (flickSpeed > 8) {
            const t = min((flickSpeed - 8) / 17, 1)
            const boost = 1.15 + t * (1.6 - 1.15)
            moveX *= boost
            moveY *= boost
        }

        const maxAbs = max(abs(moveX), abs(moveY))
        if (maxAbs > maxMove) {
            s = maxMove / maxAbs
            moveX *= s
            moveY *= s
        }

        const step = () => {
            moveX *= inertia
            moveY *= inertia

            data = { ...data }
            if (abs(moveX) < stopMove && abs(moveY) < stopMove) return this.dragEndReal(data)

            PointHelper.move(data, moveX, moveY)
            this.drag(data)

            this.animate(step)
            interaction.emit(MoveEvent.DRAG_ANIMATE, data)
        }

        this.animate(step)
    }

    return dragAnimate
}

dragger.animate = function (func?: IFunction, off?: 'off'): void { // dragEnd animation
    const animateWait = func || this.animateWait
    if (animateWait) this.interaction.target.nextRender(animateWait, null, off)
    this.animateWait = func
}

dragger.stopAnimate = function (): void {
    this.animate(null, 'off')
    this.interaction.target.nextRender(() => {
        if (this.dragData) this.dragEndReal(this.dragData)
    })
}

dragger.checkDragOut = function (data: IPointerEvent): void {
    const { interaction } = this
    this.autoMoveCancel()
    if (this.dragging && !interaction.shrinkCanvasBounds.hitPoint(data)) this.autoMoveOnDragOut(data)
}

dragger.autoMoveOnDragOut = function (data: IPointerEvent): void {
    const { interaction, downData, canDragOut } = this
    const { autoDistance, dragOut } = interaction.m
    if (!dragOut || !canDragOut || !autoDistance) return

    const bounds = interaction.shrinkCanvasBounds
    const { x, y } = bounds
    const right = BoundsHelper.maxX(bounds)
    const bottom = BoundsHelper.maxY(bounds)

    const moveX = data.x < x ? autoDistance : (right < data.x ? -autoDistance : 0)
    const moveY = data.y < y ? autoDistance : (bottom < data.y ? -autoDistance : 0)
    let totalX = 0, totalY = 0

    this.autoMoveTimer = setInterval(() => {
        totalX += moveX
        totalY += moveY

        PointHelper.move(downData, moveX, moveY)
        PointHelper.move(this.dragData, moveX, moveY)

        interaction.move({ ...data, moveX, moveY, totalX, totalY, moveType: 'drag' })
        interaction.pointerMoveReal(data)
    }, 10)
}

dragger.autoMoveCancel = function (): void {
    if (this.autoMoveTimer) {
        clearInterval(this.autoMoveTimer)
        this.autoMoveTimer = 0
    }
}