import { IValue } from '@leafer-ui/interface'
import { decorateLeafAttr, attr, State } from '@leafer-ui/draw'

export function stateType(defaultValue?: IValue, styleName?: string) {
    return decorateLeafAttr(defaultValue, (key: string) => attr({
        set(value: any) {
            this.__setAttr(key, value)
            this.waitLeafer(() => styleName ? State.setStyleName(this, styleName, value) : State.set(this, value))
        }
    }))
}

export function stateStyleType(defaultValue?: IValue) {
    return decorateLeafAttr(defaultValue, (key: string) => attr({
        set(value: any) {
            this.__setAttr(key, value)
            this.__layout.stateStyleChanged = true
        }
    }))
}