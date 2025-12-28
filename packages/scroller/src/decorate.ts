import { IValue } from '@leafer-ui/interface'
import { decorateLeafAttr, attr, doBoundsType } from '@leafer-ui/core'


export function scrollConfigType(defaultValue?: IValue) {
    return decorateLeafAttr(defaultValue, (key: string) => attr({
        set(value: IValue) {
            if (this.__setAttr(key, value)) {
                const layout = this.__layout
                layout.scrollConfigChanged = true
                doBoundsType(this)
            }
        }
    }))
}
