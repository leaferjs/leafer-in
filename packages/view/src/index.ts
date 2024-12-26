import { ILeaf, IBoundsData, IZoomType, IFourNumber, IPointData } from '@leafer-ui/interface'
import { Leafer, Bounds, LeafBoundsHelper, Plugin } from '@leafer-ui/draw'

import { getFixBounds, getZoomScale } from './helper'


Plugin.add('view')


Leafer.prototype.zoom = function (zoomType: IZoomType, padding?: IFourNumber, fixed?: boolean): IBoundsData {

    const { zoomLayer } = this
    const limitBounds = this.canvas.bounds.clone().shrink(padding !== undefined ? padding : 30), bounds = new Bounds()
    const center: IPointData = { x: limitBounds.x + limitBounds.width / 2, y: limitBounds.y + limitBounds.height / 2 }

    let changeScale: number
    const { scaleX } = this.__

    if (typeof zoomType === 'string') {

        switch (zoomType) {
            case 'in':
                changeScale = getZoomScale(scaleX, 'in')
                break
            case 'out':
                changeScale = getZoomScale(scaleX, 'out')
                break
            case 'fit':
                zoomType = this.boxBounds
                break
            case 'fit-width':
                zoomType = new Bounds(this.boxBounds)
                zoomType.height = 0
                break
            case 'fit-height':
                zoomType = new Bounds(this.boxBounds)
                zoomType.width = 0
                break
        }

    } else if (typeof zoomType === 'number') {
        changeScale = zoomType / scaleX
    }


    if (changeScale) {

        if (changeScale !== 1) zoomLayer.scaleOfWorld(center, this.getValidScale(changeScale))

    } else if (typeof zoomType === 'object') {

        const isArray = zoomType instanceof Array

        if (isArray || (zoomType as ILeaf).tag) {
            const list: ILeaf[] = isArray ? zoomType as ILeaf[] : [zoomType as ILeaf]
            bounds.setListWithFn(list, LeafBoundsHelper.worldBounds)
        } else {
            const innerBounds = getFixBounds(zoomType as IBoundsData, limitBounds)
            bounds.set(zoomLayer.getWorldBounds(innerBounds))
        }

        const { x, y, width, height } = bounds
        let moveX = limitBounds.x - x, moveY = limitBounds.y - y

        if (fixed) {

            moveX += Math.max((limitBounds.width - width) / 2, 0)
            moveY += Math.max((limitBounds.height - height) / 2, 0)

        } else {

            const fitScale = this.getValidScale(Math.min(limitBounds.width / width, limitBounds.height / height))
            moveX += (limitBounds.width - width * fitScale) / 2
            moveY += (limitBounds.height - height * fitScale) / 2

            zoomLayer.scaleOfWorld(bounds, fitScale)
            bounds.scaleOf(bounds, fitScale)

        }

        zoomLayer.move(moveX, moveY)
        return bounds.move(moveX, moveY)

    }

    return zoomLayer.worldBoxBounds

}