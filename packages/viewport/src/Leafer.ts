import { ILeaferType, IPointData } from '@leafer-ui/interface'

import { Leafer, Bounds, Point, DragBoundsHelper } from '@leafer-ui/core'

import { LeaferTypeCreator } from './LeaferTypeCreator'
import { getScrollType } from './helper'


const leafer = Leafer.prototype
const bounds = new Bounds(), move = new Point()

leafer.initType = function (type: ILeaferType) {
    LeaferTypeCreator.run(type, this)
}

leafer.getValidMove = function (moveX: number, moveY: number, checkLimit = true): IPointData {
    const { disabled, scrollSpread } = this.app.config.move
    move.set(moveX, moveY)

    const scrollType = getScrollType(this)
    if (scrollType) {

        if (scrollType.includes('x')) move.y = 0
        else if (scrollType.includes('y')) move.x = 0
        else Math.abs(move.x) > Math.abs(move.y) ? move.y = 0 : move.x = 0

        if (checkLimit && scrollType.includes('limit')) {
            bounds.set(this.__world).addPoint(this.zoomLayer as IPointData)
            if (scrollSpread) bounds.spread(scrollSpread)
            DragBoundsHelper.getValidMove(bounds, this.canvas.bounds, 'auto', move, true)
            if (scrollType.includes('x')) move.y = 0
            else if (scrollType.includes('y')) move.x = 0
        }
    }

    return { x: disabled ? 0 : move.x, y: disabled ? 0 : move.y }
}

leafer.getValidScale = function (changeScale: number): number {
    const { scaleX } = this.zoomLayer.__, { min, max, disabled } = this.app.config.zoom, absScale = Math.abs(scaleX * changeScale)
    if (min && absScale < min) changeScale = min / scaleX
    else if (max && absScale > max) changeScale = max / scaleX
    return disabled ? 1 : changeScale // fix 不能过滤小数位
}