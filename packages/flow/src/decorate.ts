import { attr, decorateLeafAttr, doBoundsType, isNumber } from '@leafer-ui/draw'
import { ILeaf, IValue } from '@leafer/interface'


function autoBoundsParentChange(parent: ILeaf) {
    parent.__hasGrow = true
}

export function autoBoundsType(defaultValue?: IValue) {
    return decorateLeafAttr(defaultValue, (key: string) => attr({
        set(value: IValue) {
            const grow = isNumber(value) ? value : 0
            key === 'autoWidth' ? this.__widthGrow = grow : this.__heightGrow = grow
            if (this.__setAttr(key, value)) {
                if (grow) this.waitParentChange(autoBoundsParentChange)
                doBoundsType(this)
            }
        }
    }))
}