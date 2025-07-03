import { attr, decorateLeafAttr, doBoundsType, isNumber } from '@leafer-ui/draw'
import { IValue } from '@leafer/interface'


export function autoBoundsType(defaultValue?: IValue) {
    return decorateLeafAttr(defaultValue, (key: string) => attr({
        set(value: IValue) {
            const grow = isNumber(value) ? value : 0
            key === 'autoWidth' ? this.__widthGrow = grow : this.__heightGrow = grow
            if (grow && !(this.parent && this.parent.__hasGrow)) this.waitParent(() => { this.parent.__hasGrow = true }) // 需要优化， 移入到其他容器中的时候也需要优化
            this.__setAttr(key, value) && doBoundsType(this)
        }
    }))
}