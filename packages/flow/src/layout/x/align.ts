import { IBox, IFlowAlign, IAxisAlign } from '@leafer-ui/interface'

import { IFlowDrawData, IFlowWrapDrawData } from '@leafer-in/interface'

import { alignContent, alignToInnerXMap } from '../common/align'


export function align(box: IBox, data: IFlowWrapDrawData, contentAlign: IFlowAlign, innerXAlign: IAxisAlign): void {
    alignContent(box, data, contentAlign)

    const { list } = data
    if (list.length > 1) {

        if (!innerXAlign) innerXAlign = alignToInnerXMap[contentAlign]

        if (innerXAlign !== 'from') {
            let row: IFlowDrawData

            for (let i = 0, len = list.length; i < len; i++) {
                row = list[i]
                row.x = data.width - row.width
                if (innerXAlign === 'center') row.x /= 2
            }

        }
    }
}