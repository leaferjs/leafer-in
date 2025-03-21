import { ILeaferType, IPointData } from '@leafer-ui/interface'

import { Leafer, Bounds, MathHelper } from '@leafer-ui/core'

import { LeaferTypeCreator } from './LeaferTypeCreator'


const leafer = Leafer.prototype
const bounds = new Bounds()

leafer.initType = function (type: ILeaferType) {
    LeaferTypeCreator.run(type, this)
}

leafer.getValidMove = function (moveX: number, moveY: number): IPointData {
    const { scroll, disabled } = this.app.config.move

    if (scroll) {
        const type = scroll === true ? '' : scroll

        if (type.includes('x')) moveX = moveX || moveY, moveY = 0
        else if (type.includes('y')) moveY = moveY || moveX, moveX = 0
        else Math.abs(moveX) > Math.abs(moveY) ? moveY = 0 : moveX = 0

        if (type.includes('limit')) {
            const { x, y, width, height } = bounds.set(this.__world).addPoint(this.zoomLayer as IPointData)
            const right = x + width - this.width, bottom = y + height - this.height

            if (x >= 0 && right <= 0) moveX = 0 // includeX
            else if (moveX > 0) { if (x + moveX > 0) moveX = -x }
            else if (moveX < 0 && right + moveX < 0) moveX = -right

            if (y >= 0 && bottom <= 0) moveY = 0 // includeY
            else if (moveY > 0) { if (y + moveY > 0) moveY = -y }
            else if (moveY < 0 && bottom + moveY < 0) moveY = -bottom
        }
    }
    return { x: disabled ? 0 : moveX, y: disabled ? 0 : moveY }
}

leafer.getValidScale = function (changeScale: number): number {
    const { scaleX } = this.zoomLayer.__, { min, max, disabled } = this.app.config.zoom, absScale = Math.abs(scaleX * changeScale)
    if (min && absScale < min) changeScale = min / scaleX
    else if (max && absScale > max) changeScale = max / scaleX
    return disabled ? 1 : changeScale // fix 不能过滤小数位
}