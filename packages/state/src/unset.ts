import { ILeaf, IStateStyleType } from '@leafer/interface'
import { State } from '@leafer-ui/core'

import { setStateStyle } from './set'
import { hasFixedState, restoreStyle } from './helper'


export function unsetStateStyle(leaf: ILeaf, _stateType: IStateStyleType, pointerState?: boolean): void {

    if (pointerState) {

        if (!hasFixedState(leaf)) {

            restoreStyle(leaf)

            // press > hover
            if (State.isPress(leaf) && leaf.pressStyle) {
                setStateStyle(leaf, 'pressStyle', true)
            } else if (State.isHover(leaf) && leaf.hoverStyle) {
                setStateStyle(leaf, 'hoverStyle', true)
            }

        }

    } else {

        //  disabled > focus > selected
        restoreStyle(leaf)

        if (leaf.disabledStyle && leaf.disabled) {
            setStateStyle(leaf, 'disabledStyle')
        } else if (leaf.focusStyle && State.isFocus(leaf)) {
            setStateStyle(leaf, 'focusStyle')
        } else if (leaf.selectedStyle && leaf.selected) {
            setStateStyle(leaf, 'selectedStyle')
        }

    }

}