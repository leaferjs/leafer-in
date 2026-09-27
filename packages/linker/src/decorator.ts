import { IValue } from '@leafer-ui/interface'
import { decorateLeafAttr, attr, doBoundsType, doStrokeType } from '@leafer-ui/draw'


export function linkerPointType(defaultValue?: IValue) {
    return decorateLeafAttr(defaultValue, (key: string) => attr({
        set(value: IValue) {
            if (this.__setAttr(key, value)) {
                const layout = this.__layout
                if (!layout.linkerChanged) {
                    doBoundsType(this)
                    doStrokeType(this)
                    layout.linkerChanged = true
                }
            }
        }
    }))
}