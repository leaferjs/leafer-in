import { IPointerEvent } from '@leafer-ui/interface'

import { Dragger, BoundsHelper, PointHelper } from '@leafer-ui/core'


Dragger.prototype.checkDragOut = function (data: IPointerEvent): void {
    const { interaction } = this
    this.autoMoveCancel()
    if (this.dragging && !interaction.shrinkCanvasBounds.hitPoint(data)) this.autoMoveOnDragOut(data)
}

Dragger.prototype.autoMoveOnDragOut = function (data: IPointerEvent): void {
    const { interaction, downData, canDragOut } = this
    const { autoDistance, dragOut } = interaction.config.move
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

Dragger.prototype.autoMoveCancel = function (): void {
    if (this.autoMoveTimer) {
        clearInterval(this.autoMoveTimer)
        this.autoMoveTimer = 0
    }
}