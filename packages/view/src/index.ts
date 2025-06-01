import { ILeaf, IBoundsData, IZoomType, IZoomOptions, IFourNumber, IPointData, ITransition } from '@leafer-ui/interface'
import { Leafer, Bounds, LeafBoundsHelper, Plugin, PointHelper } from '@leafer-ui/draw'

import { getFixBounds, getZoomScale } from './helper'


Plugin.add('view')


Leafer.prototype.zoom = function (zoomType: IZoomType, optionsOrPadding?: IZoomOptions | IFourNumber, scroll?: 'x' | 'y' | boolean, transition?: ITransition): IBoundsData {

    this.killAnimate()

    let padding: IFourNumber

    if (typeof optionsOrPadding === 'object' && !(optionsOrPadding instanceof Array)) {
        padding = optionsOrPadding.padding
        scroll = optionsOrPadding.scroll
        transition = optionsOrPadding.transition
    } else padding = optionsOrPadding

    const { zoomLayer } = this
    const limitBounds = this.canvas.bounds.clone().shrink(padding !== undefined ? padding : 30), bounds = new Bounds()
    const center: IPointData = { x: limitBounds.x + limitBounds.width / 2, y: limitBounds.y + limitBounds.height / 2 }

    let changeScale: number
    const { x, y, scaleX, scaleY } = zoomLayer.__

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

        changeScale = this.getValidScale(changeScale)
        zoomLayer.scaleOfWorld(center, changeScale, changeScale, false, transition)

    } else if (typeof zoomType === 'object') {

        const data = { x, y, scaleX, scaleY }
        const isArray = zoomType instanceof Array

        if (isArray || (zoomType as ILeaf).tag) {
            const list: ILeaf[] = isArray ? zoomType as ILeaf[] : [zoomType as ILeaf]
            bounds.setListWithFn(list, LeafBoundsHelper.worldBounds)
        } else {
            const innerBounds = getFixBounds(zoomType as IBoundsData, limitBounds)
            bounds.set(zoomLayer.getWorldBounds(innerBounds))
        }

        const { width, height } = bounds
        let moveX = limitBounds.x - bounds.x, moveY = limitBounds.y - bounds.y

        if (scroll) {

            moveX += Math.max((limitBounds.width - width) / 2, 0)
            moveY += Math.max((limitBounds.height - height) / 2, 0)

        } else {

            changeScale = this.getValidScale(Math.min(limitBounds.width / width, limitBounds.height / height))
            moveX += (limitBounds.width - width * changeScale) / 2
            moveY += (limitBounds.height - height * changeScale) / 2

            PointHelper.scaleOf(data, bounds, changeScale)
            bounds.scaleOf(bounds, changeScale)

            data.scaleX *= changeScale
            data.scaleY *= changeScale
        }

        if (scroll === 'x') moveY = 0
        else if (scroll === 'y') moveX = 0

        PointHelper.move(data, moveX, moveY)
        bounds.move(moveX, moveY)

        zoomLayer.set(data, transition)

        return bounds

    }

    return zoomLayer.worldBoxBounds

}