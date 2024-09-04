import { IUI, IStateName, } from '@leafer-ui/interface'

import { findParentButton } from './helper'


export function checkPointerState(fnName: 'isHover' | 'isPress' | 'isFocus' | 'isDrag', leaf: IUI, button?: IUI | boolean): boolean {
    let find: boolean
    const interaction = leaf.leafer ? leaf.leafer.interaction : null
    if (interaction) {
        find = interaction[fnName](leaf)
        if (!find && button) {
            const parentButton = findParentButton(leaf, button)
            if (parentButton) find = interaction[fnName](parentButton)
        }
    }
    return find
}

export function checkFixedState(attrName: 'selected' | 'disabled', leaf: IUI, button?: IUI | boolean): boolean {
    let find = leaf[attrName]
    if (!find && button) {
        const parentButton = findParentButton(leaf, button)
        if (parentButton) find = parentButton[attrName]
    }
    return find
}

export function checkState(stateName: IStateName, leaf: IUI, button?: IUI | boolean): boolean {
    let find = leaf.states[stateName]
    if (!find && button) {
        const parentButton = findParentButton(leaf, button)
        if (parentButton) find = parentButton.states[stateName]
    }
    return !!find
}
