import { ILeaferType, IPointData } from '@leafer-ui/interface'

import { Leafer, Bounds, Point, DragBoundsHelper } from '@leafer-ui/core'

import { LeaferTypeCreator } from './LeaferTypeCreator'


const leafer = Leafer.prototype
const bounds = new Bounds(), move = new Point()

leafer.initType = function (type: ILeaferType) {
    LeaferTypeCreator.run(type, this)
}

leafer.getValidMove = function (moveX: number, moveY: number, checkLimit = true): IPointData {
    const { scroll, disabled } = this.app.config.move
    move.set(moveX, moveY)

    if (scroll) {
        const type = scroll === true ? '' : scroll

        if (type.includes('x')) move.x = move.x || move.y, move.y = 0
        else if (type.includes('y')) move.y = move.y || move.x, move.x = 0
        else Math.abs(move.x) > Math.abs(move.y) ? move.y = 0 : move.x = 0

        if (checkLimit && type.includes('limit')) {
            bounds.set(this.__world).addPoint(this.zoomLayer as IPointData)
            DragBoundsHelper.getValidMove(bounds, this.canvas.bounds, 'inner', move, true)
            if (type.includes('x')) move.y = 0
            else if (type.includes('y')) move.x = 0
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