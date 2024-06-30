import { IBoundsData, IBox, IUI, IPointData, IAxisAlign } from '@leafer-ui/interface'

import { PointHelper } from '@leafer-ui/draw'

import { IFlowDrawData, IFlowWrapDrawData } from '@leafer-in/interface'


const { move } = PointHelper

export function layout(box: IBox, data: IFlowWrapDrawData, rowYAlign?: IAxisAlign, reverse?: boolean): void {
    const { list } = data, reverseWrap = box.__.flowWrap === 'reverse'
    let row: IFlowDrawData, { x, y } = data

    for (let i = 0, len = list.length; i < len; i++) {
        row = list[reverseWrap ? len - 1 - i : i]
        layoutX(box, row, x, y, rowYAlign, reverse)
        y += row.height + data.gap
    }
}

export function layoutX(box: IBox, row: IFlowDrawData, fromX: number, fromY: number, rowYAlign: IAxisAlign, reverse?: boolean): void {
    const { children } = box
    let child: IUI, local: IBoundsData, { x, start } = row, y = fromY
    x += fromX

    for (let j = 0, end = row.count; j < end; j++) {
        child = children[reverse ? start - j : start + j]

        if (child.__.inFlow && child.__.visible !== 0) {
            local = child.__flowBounds
            if (rowYAlign !== 'from') y = fromY + (row.height - local.height) / (rowYAlign === 'center' ? 2 : 1)

            move(child as IPointData, x - local.x, y - local.y)
            x += local.width + row.gap
        } else {
            end++
        }
    }
}