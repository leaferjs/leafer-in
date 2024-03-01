import { ILeaf, IObject, IStateStyleType } from '@leafer-ui/interface'
import { State } from '@leafer-ui/core'

import { hasFixedState, restoreStyle } from './helper'


export function setStateStyle(leaf: ILeaf, stateType: IStateStyleType, pointerState?: boolean): void {

    let style: IObject
    const data = leaf.__ as IObject

    if (pointerState) {

        // hover / press
        style = !hasFixedState(leaf) && data[stateType]

    } else {

        //  disabled > focus > selected
        switch (stateType) {
            case 'disabledStyle':
                style = data[stateType]
                break
            case 'focusStyle':
                style = !leaf.disabled && data[stateType]
                break
            case 'selectedStyle':
                style = !leaf.disabled && !State.isFocus(leaf) && data[stateType]
                break
        }

    }

    if (style) {
        restoreStyle(leaf) // 先回到正常状态
        leaf.__.normalStyle = leaf.get(style) as IObject
        leaf.set(style)
    }

}