import { attr, decorateLeafAttr, doBoundsType } from '@leafer-ui/draw'
import { ILeaf, IValue, IInset } from '@leafer-ui/interface'


function positionParentChange(parent: ILeaf) {
    parent.__hasPosition = true
}

export function positionType(defaultValue?: IValue) {
    return decorateLeafAttr(defaultValue, (key: string) => attr({
        set(value: IValue) {
            if (this.__setAttr(key, value)) {
                if (value) {
                    if ((value as IInset).id) {
                        const data = this.__
                        if (!data.__usePositionNode) {
                            data.__usePositionNode = true
                            this.__updatePositionLayout = this.__updatePositionLayout.bind(this)
                        }
                    } else this.waitParentChange(positionParentChange)
                }
                doBoundsType(this)
            }
        }
    }))
}