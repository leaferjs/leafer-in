import { IUI, IStateStyleType } from '@leafer-ui/interface'
import { State } from '@leafer-ui/core'

import { setStateStyle } from './set'
import { hasFixedState, restoreStyle } from './helper'


export function unsetStateStyle(leaf: IUI, stateType: IStateStyleType, pointerState?: boolean): void {

    const data = leaf.__
    if (!data[stateType]) return

    if (pointerState) {

        if (!hasFixedState(leaf)) {

            restoreStyle(leaf)

            // press > hover
            if (State.isPress(leaf) && data.pressStyle) {
                setStateStyle(leaf, 'pressStyle', true)
            } else if (State.isHover(leaf) && data.hoverStyle) {
                setStateStyle(leaf, 'hoverStyle', true)
            }

        }

    } else {

        //  disabled > focus > selected
        restoreStyle(leaf)

        if (data.disabledStyle && data.disabled) {
            setStateStyle(leaf, 'disabledStyle')
        } else if (data.focusStyle && State.isFocus(leaf)) {
            setStateStyle(leaf, 'focusStyle')
        } else if (data.selectedStyle && data.selected) {
            setStateStyle(leaf, 'selectedStyle')
        }

    }

}