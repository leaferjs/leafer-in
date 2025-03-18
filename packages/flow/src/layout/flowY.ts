import { IBoundsData, IBox, IUI, IPointData } from '@leafer-ui/interface'
import { PointHelper } from '@leafer-ui/draw'

import { IFlowDrawData } from '@leafer-in/interface'

import { align } from './y/align'
import { alignContent } from './common/align'
import { layout, layoutY } from './y/layout'
import { flowWrap } from './common/wrap'
import { getDrawData, getParseData, getWrapDrawData } from './common/data'
import { autoGap } from './common/gap'
import { getItemBounds } from './common/bounds'
import { growY } from './y/grow'
import { resizeWidth } from './x/grow'


const { move } = PointHelper

export function flowY(box: IBox, reverse?: boolean): void {
    const side = 'height', { children, itemBox } = box, pData = getParseData(box, false)
    const { complex, wrap, xGap, yGap, isAutoYGap, isFitYGap } = pData
    if (!children.length) return

    const wrapData = wrap && getWrapDrawData(), yGapTempNum = isAutoYGap ? 0 : yGap as number
    let child: IUI, local: IBoundsData, localHeight: number, index: number, data: IFlowDrawData, { x, y, width, height } = box.__layout.contentBounds

    for (let i = 0, len = children.length; i < len; i++) {
        child = children[index = reverse ? len - 1 - i : i]

        if (child.__.inFlow && child.__.visible !== 0) {

            local = getItemBounds(child, itemBox)

            if (complex) {

                child.__flowBounds = local
                if (!data) data = getDrawData(index, yGapTempNum)

                if (wrap && data.count && data.height + local.height > height) {
                    if (data.grow) growY(box, data, height, reverse)
                    if (isAutoYGap) autoGap(data, side, height, isFitYGap)
                    flowWrap(wrapData, data, side)

                    data = getDrawData(index, yGapTempNum)
                }

                localHeight = local.height

                if (child.__heightGrow) {
                    data.grow += child.__heightGrow, localHeight = 0
                    if (child.__.heightRange) data.hasRangeSize = true
                }

                if (child.__widthGrow) resizeWidth(child, local, width)

                data.height += data.count ? localHeight + yGapTempNum : localHeight
                data.width = Math.max(data.width, local.width)
                data.count++

            } else {

                move(child as IPointData, x - local.x, y - local.y)
                y += local.height + yGapTempNum

            }

        }

    }

    if (complex && data) {

        const { isAutoXGap, isFitXGap, contentAlign, rowXAlign, rowYAlign } = pData

        if (data.count) {
            if (data.grow) growY(box, data, height, reverse)
            if (isAutoYGap) autoGap(data, side, height, isFitYGap)
            if (wrap) flowWrap(wrapData, data, side)
        }

        if (wrap) {

            if (isAutoXGap) autoGap(wrapData, 'width', width, isFitXGap)
            else wrapData.width += (wrapData.gap = xGap as number) * (wrapData.list.length - 1)

            align(box, wrapData, contentAlign, rowYAlign)
            layout(box, wrapData, rowXAlign, reverse)

        } else {

            alignContent(box, data, contentAlign)
            layoutY(box, data, data.x, 0, rowXAlign, reverse)

        }

    }
}