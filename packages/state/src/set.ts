import { IUI, IStateStyle, IStateStyleType, IStateName } from '@leafer-ui/interface'
import { State, isUndefined } from '@leafer-ui/core'

import { setStyle } from './style'


export function setPointerState(leaf: IUI, stateName: IStateStyleType): void {
    const style = leaf[stateName]
    if (style) setStyle(leaf, style)
    if (leaf.button) setChildrenState(leaf.children, stateName)
}

export function setState(leaf: IUI, stateName: string, stateStyle?: IStateStyle): void {
    if (!stateStyle) stateStyle = leaf.states[stateName]
    setStyle(leaf, stateStyle)
    if (leaf.button) setChildrenState(leaf.children, null, stateName)
}


function setChildrenState(children: IUI[], stateType: IStateStyleType, stateName?: IStateName): void {
    if (!children) return

    let leaf: IUI, update: boolean
    for (let i = 0, len = children.length; i < len; i++) {
        leaf = children[i]
        if (stateType) {

            update = true
            switch (stateType) {
                case 'hoverStyle':
                    if (State.isHover(leaf)) update = false
                    break
                case 'pressStyle':
                    if (State.isPress(leaf)) update = false
                    break
                case 'focusStyle':
                    if (State.isFocus(leaf)) update = false
            }
            if (update) setPointerState(leaf, stateType)

        } else if (!isUndefined(stateName)) setState(leaf, stateName)

        if (leaf.isBranch) setChildrenState(leaf.children, stateType, stateName)
    }
}