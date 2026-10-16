export { registerImageFilter, applyFilter } from './filter'

import { ILeafPaint, ILeaferImage, IImageFilters, IUI } from '@leafer-ui/interface'
import { PaintImage, Plugin, Creator, Platform, LeaferImage } from '@leafer-ui/draw'
import { applyFilter } from './filter'


Plugin.add('image-filter')


function getFilterKey(filter: IImageFilters): string {
    let key = ''
    filter.forEach(item => {
        key += item.type + '-' + item.value
    })
    return key
}


Platform.image.applyFilter = applyFilter


// 存在lod的情况
function copyLevels(filterImage: ILeaferImage, image: ILeaferImage, filter: IImageFilters) {
    const { thumb, levels } = image

    // 初始化level
    if (levels || filterImage.levels) {
        if (filterImage.levels) filterImage.clearLevels() // 清理掉
        filterImage.lod = image.lod
        filterImage.levels = []
        filterImage.levelsRange = image.levelsRange || {}
    }

    // 复制thumb
    if (thumb) {
        const { level, scale, view } = thumb
        const canvas = Platform.origin.createCanvas(view.width, view.height)
        applyFilter(canvas, thumb.view, filter)
        filterImage.thumb = { level, scale, view: canvas }
        filterImage.levels[thumb.level] = filterImage.thumb

        if (filterImage.view && !image.view) { // 需要销毁 view
            const { view } = filterImage
            if (view && view.close) view.close() // 可能为 ImageBitmap
            filterImage.view = undefined
        }
    }

}


PaintImage.applyFilter = function (leafPaint: ILeafPaint, image: ILeaferImage, filter: IImageFilters, ui: IUI): void {
    if (!filter.length || image.isSVG) return

    let filterImage: ILeaferImage, updateFilter: boolean
    const key = getFilterKey(filter)

    if (image.childrenMap) filterImage = image.childrenMap[ui.innerId]

    if (filterImage) {

        // 检查一下是否需要更新
        if (key !== filterImage.filterKey) {
            copyLevels(filterImage, image, filter)
            updateFilter = true
        }

    } else {
        filterImage = Creator.image({ url: image.url })
        filterImage.config = image.config
        const { width, height } = image

        filterImage.width = width
        filterImage.height = height

        if (image.hasAlphaPixel) filterImage.hasAlphaPixel = true
        image.ready = true

        filterImage.parent = image
        image.childrenMap || (image.childrenMap = {})
        image.childrenMap[ui.innerId] = filterImage

        if (image.levels) copyLevels(filterImage, image, filter)

        if (image.view) {
            const canvas = Platform.origin.createCanvas(width, height)
            filterImage.view = canvas
        }

        updateFilter = true
    }

    if (updateFilter) {
        if (filterImage.view) applyFilter(filterImage.view, image.view, filter)
        filterImage.filterKey = key
        filterImage.filter = filter
    }

    leafPaint.image = filterImage
}

PaintImage.recycleFilter = function (image: ILeaferImage, ui: IUI): void {
    if (image.parent) {
        delete image.parent.childrenMap[ui.innerId]
        image.destroy()
    }
}

LeaferImage.prototype.destroyFilter = function () {
    const t = this as ILeaferImage
    t.filter = null
    if (t.parent) t.parent = null
    if (t.childrenMap) {
        Object.values(t.childrenMap).forEach(item => item.destroy())
        t.childrenMap = null
    }
}