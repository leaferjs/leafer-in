import { IBoundsData, IBox, IUI, IPointData, IAxisAlign } from '@leafer-ui/interface'
import { PointHelper } from '@leafer-ui/draw'

import { IFlowDrawData, IFlowWrapDrawData } from '@leafer-in/interface'


const { move } = PointHelper

export function layout(box: IBox, data: IFlowWrapDrawData, rowXAlign: IAxisAlign, reverse?: boolean): void {
    const { list } = data, reverseWrap = box.__.flowWrap === 'reverse'
    let row: IFlowDrawData, { x, y } = data

    for (let i = 0, len = list.length; i < len; i++) {
        row = list[reverseWrap ? len - 1 - i : i]
        layoutY(box, row, x, y, rowXAlign, reverse)
        x += row.width + data.gap
    }
}

export function layoutY(box: IBox, row: IFlowDrawData, fromX: number, fromY: number, rowXAlign: IAxisAlign, reverse?: boolean): void {
    const { children } = box
    let child: IUI, local: IBoundsData, { y, start } = row, x = fromX
    y += fromY

    for (let j = 0, end = row.count; j < end; j++) {
        child = children[reverse ? start - j : start + j]

        if (child.__.inFlow && child.__.visible !== 0) {
            local = child.__flowBounds
            if (rowXAlign !== 'from') x = fromX + (row.width - local.width) / (rowXAlign === 'center' ? 2 : 1)

            move(child as IPointData, x - local.x, y - local.y)
            y += local.height + row.gap
        } else {
            end++
        }
    }
}