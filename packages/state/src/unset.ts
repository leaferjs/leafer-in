import { IUI, IStateStyleType, IStateStyle, IUIData } from '@leafer-ui/interface'
import { State } from '@leafer-ui/core'

import { assignScale, findStyle, getFromStyle, getStatesStyle, hasFixedState, restoreStyle } from './helper'


export function unsetPointerStateStyle(leaf: IUI, stateName: IStateStyleType): void {
    const style = !hasFixedState(leaf) && leaf[stateName]
    if (style) unsetStyle(leaf, stateName, style)
    if (leaf.button) unsetChildrenPointerStateStyle(leaf.children, stateName)
}

export function unsetStateStyle(leaf: IUI, stateName: string, stateStyle: IStateStyle): void {
    unsetStyle(leaf, stateName, stateStyle)
}

function unsetStyle(leaf: IUI, _stateName: string, style: IStateStyle): void {
    if (typeof style !== 'object') style = undefined

    const data = leaf.__, { normalStyle } = data

    if (normalStyle) {
        const statesStyle = getStatesStyle(leaf)
        if (!style) style = normalStyle

        if (style.scale) assignScale(style)

        const easeOut = getEaseOut(style, data)
        const fromStyle = getFromStyle(leaf, style)

        leaf.killAnimate()
        restoreStyle(leaf) // 必须在得到 toStyle 之后执行

        if (statesStyle) {
            data.normalStyle = findStyle(statesStyle, data)
            leaf.set(statesStyle, true)
        } else {
            data.normalStyle = undefined
        }

        if (easeOut && fromStyle) {
            const toStyle = findStyle(fromStyle, data)
            leaf.set(fromStyle, true)
            leaf.animate([fromStyle, toStyle], easeOut, true)
        }
    }
}

function unsetChildrenPointerStateStyle(children: IUI[], stateType: IStateStyleType): void {
    if (!children) return
    let leaf: IUI
    for (let i = 0, len = children.length; i < len; i++) {
        leaf = children[i]
        if (!leaf.button) {
            switch (stateType) {
                case 'hoverStyle':
                    if (!State.isHover(leaf)) unsetPointerStateStyle(leaf, stateType)
                    break
                case 'pressStyle':
                    if (!State.isPress(leaf)) unsetPointerStateStyle(leaf, stateType)
                    break
                case 'focusStyle':
                    if (!State.isFocus(leaf)) unsetPointerStateStyle(leaf, stateType)
                    break
            }
            if (leaf.isBranch) unsetChildrenPointerStateStyle(leaf.children, stateType)
        }
    }
}

function getEaseOut(style: IStateStyle, data: IUIData): any {
    const ease = (!style || style.ease === undefined) ? data.ease : style.ease
    let easeOut = (!style || style.easeOut === undefined) ? data.easeOut : style.easeOut
    if (ease && easeOut === undefined) easeOut = ease
    return easeOut
}