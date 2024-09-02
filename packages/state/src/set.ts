import { IUI, IObject, IStateStyle, IStateStyleType, IUIData } from '@leafer-ui/interface'
import { State } from '@leafer-ui/core'

import { findStyle, getStatesStyle, hasFixedState, restoreStyle } from './helper'


export function setPointerStateStyle(leaf: IUI, stateName: IStateStyleType): void {
    const style = !hasFixedState(leaf) && leaf[stateName]   // disabled 等 固定状态下 不可以叠加交互状态 focus / hover / press
    if (style) setStyle(leaf, stateName, style)
    if (leaf.button) setChildrenPointerStateStyle(leaf.children, stateName)
}

export function setStateStyle(leaf: IUI, stateName: string, stateStyle: IStateStyle): void {
    if (stateStyle) setStyle(leaf, stateName, stateStyle)
}


function setChildrenPointerStateStyle(children: IUI[], stateType: IStateStyleType): void {
    if (!children) return
    let leaf: IUI
    for (let i = 0, len = children.length; i < len; i++) {
        leaf = children[i]
        if (!leaf.button) {
            switch (stateType) {
                case 'hoverStyle':
                    if (!State.isHover(leaf)) setPointerStateStyle(leaf, stateType)
                    break
                case 'pressStyle':
                    if (!State.isPress(leaf)) setPointerStateStyle(leaf, stateType)
                    break
                case 'focusStyle':
                    if (!State.isFocus(leaf)) setPointerStateStyle(leaf, stateType)
                    break
            }
            if (leaf.isBranch) setChildrenPointerStateStyle(leaf.children, stateType)
        }
    }
}


function getEaseIn(style: IStateStyle, data: IUIData): any {
    const ease = style.ease === undefined ? data.ease : style.ease
    let easeIn = style.easeIn === undefined ? data.easeIn : style.easeIn
    if (ease && easeIn === undefined) easeIn = ease
    return easeIn
}



function setStyle(leaf: IUI, _stateName: string, style: IStateStyle): void {
    if (typeof style !== 'object') return

    const data = leaf.__, { normalStyle } = data, easeIn = getEaseIn(style, data)
    const fromStyle = easeIn ? findStyle(style, data) : undefined

    leaf.killAnimate()
    restoreStyle(leaf)    // 必须在得到 toStyle 之后执行

    const statesStyle = normalStyle ? getStatesStyle(leaf) : style
    data.normalStyle = findStyle(statesStyle, data)
    leaf.set(statesStyle)

    if (easeIn) {
        const toStyle = findStyle(style, data)
        leaf.animate([fromStyle, toStyle], easeIn)
    }
}

