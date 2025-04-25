import { IBoundsData, IBox, IUI, IAutoSize } from '@leafer-ui/interface'
import { MathHelper } from '@leafer-ui/draw'

import { IFlowDrawData } from '@leafer-in/interface'


const { within } = MathHelper

export function growX(box: IBox, row: IFlowDrawData, width: number, reverse: boolean): void {
    let child: IUI, grow: IAutoSize, remainSpace: number, remainTotalSpace = 0, list: IUI[] = row.hasRangeSize && [], { grow: totalGrow, start } = row
    const growSize = (width - row.width) / totalGrow, { children } = box
    if (growSize <= 0) return

    row.width = width

    for (let j = 0, end = row.count; j < end; j++) {
        child = children[reverse ? start - j : start + j]

        if (child.__.inFlow && child.__.visible !== 0) {

            if (grow = child.__widthGrow) {
                remainSpace = resizeWidth(child, child.__flowBounds, growSize * grow)

                if (remainSpace) {
                    remainTotalSpace += remainSpace
                    totalGrow -= grow
                } else if (list) {
                    child.__.widthRange ? list.unshift(child) : list.push(child)
                }
            }

        } else {
            end++
        }
    }

    if (remainTotalSpace) assignRemainSpace(list, remainTotalSpace, totalGrow)
}


function assignRemainSpace(list: IUI[], totalSpace: number, countGrow: number): void {
    let grow: IAutoSize, space: number, local: IBoundsData, remain: number
    list.forEach(child => {
        grow = child.__widthGrow
        space = totalSpace / countGrow * grow
        remain = resizeWidth(child, local = child.__flowBounds, local.width + space)
        totalSpace -= space - remain
        countGrow -= grow
    })
}


export function resizeWidth(child: IUI, local: IBoundsData, size: number): number {
    const { widthRange, lockRatio } = child.__
    const realSize = widthRange ? within(size, widthRange) : size
    const scale = realSize / local.width
    child.scaleResize(scale, lockRatio ? scale : 1)
    local.width = realSize
    return size - realSize
}