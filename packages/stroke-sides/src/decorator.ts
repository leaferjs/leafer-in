import { IUIData, IValue } from '@leafer-ui/interface'
import { decorateLeafAttr, attr, doStrokeType, doBoundsType, isArray, DataHelper } from '@leafer-ui/core'

export function strokeWidthType(defaultValue?: IValue) {
    return decorateLeafAttr(defaultValue, (key: string) => attr({
        set(value: IValue) {
            if (this.__setAttr(key, value)) {
                doStrokeType(this)
                const data = this.__
                data.__useStroke = true
                let hasStrokeSides
                DataHelper.stintSet(data as IUIData, '__hasStrokeSides', hasStrokeSides = isArray(value) && Math.max(...value))
                if (hasStrokeSides) {
                    doBoundsType(this)
                } else if ((data as IUIData).__pathForStroke) (data as IUIData).__pathForStroke = undefined
            }
        }
    }))
}