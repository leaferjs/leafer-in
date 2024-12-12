import { IBoundsData, IBox, IUI, IPointData } from '@leafer-ui/interface'
import { PointHelper } from '@leafer-ui/draw'

import { IFlowDrawData } from '@leafer-in/interface'

import { align } from './x/align'
import { alignContent } from './common/align'
import { layout, layoutX } from './x/layout'
import { flowWrap } from './common/wrap'
import { getDrawData, getParseData, getWrapDrawData } from './common/data'
import { autoGap } from './common/gap'
import { getItemBounds } from './common/bounds'
import { growX } from './x/grow'
import { resizeHeight } from './y/grow'


const { move } = PointHelper

export function flowX(box: IBox, reverse?: boolean): void {
    const side = 'width', { children, itemBox } = box, pData = getParseData(box, true)
    const { complex, wrap, xGap, yGap, isAutoXGap, isFitXGap } = pData
    if (!children.length) return

    const wrapData = wrap && getWrapDrawData(), xGapTempNum = isAutoXGap ? 0 : xGap as number
    let child: IUI, local: IBoundsData, localWidth: number, index: number, data: IFlowDrawData, { x, y, width, height } = box.__layout.contentBounds

    for (let i = 0, len = children.length; i < len; i++) {
        child = children[index = reverse ? len - 1 - i : i]

        if (child.__.inFlow && child.__.visible !== 0) {

            local = getItemBounds(child, itemBox)

            if (complex) {

                child.__flowBounds = local
                if (!data) data = getDrawData(index, xGapTempNum)

                if (wrap && data.count && data.width + local.width > width) {

                    if (data.grow) growX(box, data, width, reverse)
                    else if (isAutoXGap) autoGap(data, side, width, isFitXGap)
                    flowWrap(wrapData, data, side)

                    data = getDrawData(index, xGapTempNum)
                }

                localWidth = local.width

                if (child.__widthGrow) {
                    data.grow += child.__widthGrow, localWidth = 0
                    if (child.__.widthRange) data.hasRangeSize = true
                }

                if (child.__heightGrow) resizeHeight(child, local, height)

                data.width += data.count ? localWidth + xGapTempNum : localWidth
                data.height = Math.max(data.height, local.height)
                data.count++


            } else {

                move(child as IPointData, x - local.x, y - local.y)
                x += local.width + xGapTempNum

            }

        }

    }

    if (complex && data) {

        const { isAutoYGap, isFitYGap, contentAlign, rowXAlign, rowYAlign } = pData

        if (data.count) {
            if (data.grow) growX(box, data, width, reverse)
            else if (isAutoXGap) autoGap(data, side, width, isFitXGap)
            if (wrap) flowWrap(wrapData, data, side)
        }

        if (wrap) {

            if (isAutoYGap) autoGap(wrapData, 'height', height, isFitYGap)
            else wrapData.gap = yGap as number

            align(box, wrapData, contentAlign, rowXAlign)
            layout(box, wrapData, rowYAlign, reverse)

        } else {

            alignContent(box, data, contentAlign)
            layoutX(box, data, 0, data.y, rowYAlign, reverse)

        }

    }
}


// if (typeof autoWidth === 'object') {

//     const realWidth = width * autoWidth.value / 100 // 百分比
//     data.width += data.count ? realWidth + xGapTempNum : realWidth
//     const scaleX = realWidth / local.width
//     child.scaleResize(scaleX, 1, true)
//     local.width = realWidth

// } else 