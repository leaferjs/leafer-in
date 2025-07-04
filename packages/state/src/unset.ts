import { IUI, IStateStyleType, IStateStyle, IStateName } from '@leafer-ui/interface'
import { isUndefined } from '@leafer-ui/core'

import { unsetStyle } from './style'


export function unsetPointerState(leaf: IUI, stateName: IStateStyleType): void {
    const style = leaf[stateName]
    if (style) unsetStyle(leaf, style)
    if (leaf.button) unsetChildrenState(leaf.children, stateName)
}

export function unsetState(leaf: IUI, stateName: string, stateStyle?: IStateStyle): void {
    unsetStyle(leaf, stateStyle)
    if (leaf.button) unsetChildrenState(leaf.children, null, stateName)
}


function unsetChildrenState(children: IUI[], stateType: IStateStyleType, stateName?: IStateName): void {
    if (!children) return

    let leaf: IUI
    for (let i = 0, len = children.length; i < len; i++) {
        leaf = children[i]
        if (stateType) unsetPointerState(leaf, stateType)
        else if (!isUndefined(stateName)) unsetState(leaf, stateName)

        if (leaf.isBranch) unsetChildrenState(leaf.children, stateType, stateName)
    }
}