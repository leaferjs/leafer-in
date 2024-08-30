import { IUI, IObject, IStateStyleType, IUIEaseInputData } from '@leafer-ui/interface'
import { State } from '@leafer-ui/core'

import { hasFixedState, restoreStyle } from './helper'


export function setStateStyle(leaf: IUI, stateType: IStateStyleType, pointerState?: boolean): void {

    let style: IUIEaseInputData
    const data = leaf.__

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
                style = !data.disabled && data[stateType]
                break
            case 'selectedStyle':
                style = !data.disabled && !State.isFocus(leaf) && data[stateType]
                break
        }

    }


    if (style) {
        restoreStyle(leaf) // 先回到正常状态

        let { ease, easeIn, easeOut } = style
        if (ease) {
            if (!easeIn) easeIn = true
            if (!easeOut) easeOut = true
        }

        if (easeIn) {
            const { from } = leaf.animate(style, easeIn as any)
            style = from
        }

        leaf.__.normalStyle = leaf.get(style) as IObject
        if (easeOut) leaf.__.normalStyle.easeOut = easeOut

        if (!easeIn) {
            leaf.killAnimate()
            leaf.set(style)
        }
    }

}