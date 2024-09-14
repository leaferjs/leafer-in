import { IValue, IUI } from '@leafer-ui/interface'
import { decorateLeafAttr, attr, doStrokeType } from '@leafer-ui/draw'

export function arrowType(defaultValue?: IValue) {
    return decorateLeafAttr(defaultValue, (key: string) => attr({
        set(value: IValue) {
            if (this.__setAttr(key, value)) {
                const data = (this as IUI).__
                data.__useArrow = data.startArrow !== 'none' || data.endArrow !== 'none'
                doStrokeType(this)
            }
        }
    }))
}