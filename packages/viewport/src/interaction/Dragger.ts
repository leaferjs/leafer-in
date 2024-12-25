import { IPointerEvent, IFunction } from '@leafer-ui/interface'

import { Dragger, BoundsHelper, PointHelper } from '@leafer-ui/core'


const dragger = Dragger.prototype
const { abs } = Math

dragger.checkDragEndAnimate = function (data: IPointerEvent, speed?: number): boolean {
    const { moveX, moveY } = this.dragData
    const absMoveX = abs(moveX), absMoveY = abs(moveY)
    const dragAnimate = this.interaction.m.dragAnimate && this.canAnimate && this.moving && (absMoveX > 0.1 || absMoveY > 0.1)

    if (dragAnimate) {
        const inertia = data.pointerType === 'touch' ? 3 : 1, maxMove = 70
        speed = speed ? 0.95 : inertia
        if (absMoveX * speed > maxMove) speed = maxMove / absMoveX
        else if (absMoveY * speed > maxMove) speed = maxMove / absMoveY

        data = { ...data }
        PointHelper.move(data, moveX * speed, moveY * speed)

        this.drag(data)
        this.animate(() => { this.dragEnd(data, 1) })
    }

    return dragAnimate
}

dragger.animate = function (func?: IFunction, off?: 'off'): void { // dragEnd animation
    const animateWait = func || this.animateWait
    if (animateWait) this.interaction.target.nextRender(animateWait, null, off)
    this.animateWait = func
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