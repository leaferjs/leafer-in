import { attr, decorateLeafAttr, doBoundsType } from '@leafer-ui/draw'
import { ILeaf, IValue } from '@leafer/interface'


function positionParentChange(parent: ILeaf) {
    parent.__hasPosition = true
}

export function positionType(defaultValue?: IValue) {
    return decorateLeafAttr(defaultValue, (key: string) => attr({
        set(value: IValue) {
            if (this.__setAttr(key, value)) {
                if (value) this.waitParentChange(positionParentChange)
                doBoundsType(this)
            }
        }
    }))
}