import { IValue, IUI } from '@leafer-ui/interface'
import { decorateLeafAttr, attr, doStrokeType, doBoundsType } from '@leafer-ui/draw'

export function arrowType(defaultValue?: IValue) {
    return decorateLeafAttr(defaultValue, (key: string) => attr({
        set(value: IValue) {
            if (this.__setAttr(key, value)) {
                const data = (this as IUI).__
                const useArrow = data.startArrow !== 'none' || data.endArrow !== 'none'
                if (data.__useArrow !== useArrow) doBoundsType(this)
                data.__useArrow = useArrow
                doStrokeType(this)
            }
        }
    }))
}