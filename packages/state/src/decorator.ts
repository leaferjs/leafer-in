import { IValue } from '@leafer-ui/interface'
import { decorateLeafAttr, attr, State } from '@leafer-ui/draw'

export function stateType(defaultValue?: IValue, styleName?: string) {
    return decorateLeafAttr(defaultValue, (key: string) => attr({
        set(value: any) {
            this.__setAttr(key, value)
            if (this.leaferIsReady) styleName ? State.setStyleName(this, styleName, value) : State.set(this, value)
            else this.__layout.stateStyleChanged = true
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