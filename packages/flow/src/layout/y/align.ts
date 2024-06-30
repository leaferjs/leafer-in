import { IAxisAlign, IBox, IFlowAlign } from '@leafer-ui/interface'

import { IFlowDrawData, IFlowWrapDrawData } from '@leafer-in/interface'

import { alignContent, alignToInnerYMap } from '../common/align'


export function align(box: IBox, data: IFlowWrapDrawData, contentAlign: IFlowAlign, rowYAlign: IAxisAlign): void {
    alignContent(box, data, contentAlign)

    const { list } = data
    if (list.length > 1) {

        if (!rowYAlign) rowYAlign = alignToInnerYMap[contentAlign]

        if (rowYAlign !== 'from') {
            let row: IFlowDrawData

            for (let i = 0, len = list.length; i < len; i++) {
                row = list[i]
                row.y = data.height - row.height
                if (rowYAlign === 'center') row.y /= 2
            }

        }
    }
}

