import { IBoundsData, IBox, IUI, IAutoSize } from '@leafer-ui/interface'
import { MathHelper } from '@leafer-ui/draw'

import { IFlowDrawData } from '@leafer-in/interface'


const { within } = MathHelper

export function growY(box: IBox, row: IFlowDrawData, height: number, reverse: boolean): void {
    let child: IUI, grow: IAutoSize, remainSpace: number, remainTotalSpace = 0, list: IUI[] = row.hasRangeSize && [], { grow: totalGrow, start } = row
    const growSize = row.height < height ? (height - row.height) / totalGrow : 0, { children } = box

    if (growSize) row.height = height

    for (let j = 0, end = row.count; j < end; j++) {
        child = children[reverse ? start - j : start + j]

        if (child.__.inFlow && child.__.visible !== 0) {

            if (grow = child.__heightGrow) {
                remainSpace = resizeHeight(child, child.__flowBounds, growSize * grow)

                if (remainSpace) {
                    remainTotalSpace += remainSpace
                    totalGrow -= grow
                } else if (list) {
                    child.__.heightRange ? list.unshift(child) : list.push(child)
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
        grow = child.__heightGrow
        space = totalSpace / countGrow * grow
        remain = resizeHeight(child, local = child.__flowBounds, local.height + space)
        totalSpace -= space - remain
        countGrow -= grow
    })
}


export function resizeHeight(child: IUI, local: IBoundsData, size: number): number {
    const { heightRange, lockRatio } = child.__
    const realSize = heightRange ? within(size, heightRange.min, heightRange.max) : size
    const scale = realSize / local.height
    child.scaleResize(lockRatio ? scale : 1, scale)
    local.height = realSize
    return size - realSize
}