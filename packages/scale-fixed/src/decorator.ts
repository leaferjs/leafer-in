import { IValue } from '@leafer-ui/interface'
import { decorateLeafAttr, attr, doBoundsType, DataHelper, isNumber } from '@leafer-ui/draw'


const { stintSet } = DataHelper

export function scaleFixedType(defaultValue?: IValue) {
    return decorateLeafAttr(defaultValue, (key: string) => attr({
        set(value: any) {
            if (this.__setAttr(key, value)) {
                const layout = this.__layout
                doBoundsType(this)
                if (!isNumber(value)) value = value ? 1 : 0
                stintSet(layout, 'scaleFixed', value)
                stintSet(layout, 'hasOuter', value && value < 1)
                if (!layout.hasOuter && layout.localOuterBounds) layout.localOuterBounds = undefined
            }
        }
    }))
}