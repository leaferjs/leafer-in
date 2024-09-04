import { IUI, IObject, IUIInputData, IStateStyle, IScaleData, IUIData, IStateEase } from '@leafer-ui/interface'
import { State, MathHelper } from '@leafer-ui/core'

import { findParentButton } from './helper'


export function setStyle(leaf: IUI, style: IStateStyle): void {
    if (typeof style !== 'object') style = undefined
    updateStyle(leaf, style, 'easeIn')
}

export function unsetStyle(leaf: IUI, style?: IStateStyle): void {
    const { normalStyle } = leaf.__
    if (typeof style !== 'object') style = undefined
    if (normalStyle) {
        if (!style) style = normalStyle
        updateStyle(leaf, style, 'easeOut')
    }
}

export function updateStyle(leaf: IUI, style?: IStateStyle, easeType?: 'easeIn' | 'easeOut'): void {
    const statesStyle = getStyle(leaf), data = leaf.__

    if (!style) style = statesStyle || {}

    if (style.scale) {
        MathHelper.assignScale(style as IScaleData, style.scale)
        delete style.scale
    }

    const ease = easeType ? getEase(easeType, style, data) : undefined
    const fromStyle = ease ? getFromStyle(leaf, style) : undefined

    leaf.killAnimate()
    if (data.normalStyle) leaf.set(data.normalStyle, true)

    if (statesStyle) {
        data.normalStyle = filterStyle(statesStyle, data)
        leaf.set(statesStyle, true)
    } else {
        data.normalStyle = undefined
    }

    if (ease) {
        const toStyle = filterStyle(fromStyle, data)
        leaf.set(fromStyle, true)
        leaf.animate([fromStyle, toStyle], ease, true)
    }

    leaf.__layout.stateStyleChanged = false
}

export function getStyle(leaf: IUI): IStateStyle {

    //   从低到高依次覆盖: states < selected < focus < hover < press < disabled

    let exist: boolean
    const style: IUIInputData = {}, data = leaf.__, { state } = data, button = findParentButton(leaf)

    const stateStyle = state && data.states[state]
    if (stateStyle && State.isState(state, leaf, button)) exist = assign(style, stateStyle)

    const selectedStyle = style.selectedStyle || data.selectedStyle
    if (selectedStyle && State.isSelected(leaf, button)) exist = assign(style, selectedStyle)

    if (State.isDisabled(leaf, button)) {

        const disabledStyle = style.disabledStyle || data.disabledStyle
        if (disabledStyle) exist = assign(style, disabledStyle)

    } else {

        const focusStyle = style.focusStyle || data.focusStyle
        if (focusStyle && State.isFocus(leaf, button)) exist = assign(style, focusStyle)

        const hoverStyle = style.hoverStyle || data.hoverStyle
        if (hoverStyle && State.isHover(leaf, button)) exist = assign(style, hoverStyle)

        const pressStyle = style.pressStyle || data.pressStyle
        if (pressStyle && State.isPress(leaf, button)) exist = assign(style, pressStyle)

    }

    return exist ? style : undefined
}


function filterStyle(filter: IObject, data: IObject): IObject {
    const to: IObject = {}
    for (let key in filter) to[key] = data[key]
    return to
}

function filterAnimateStyle(filter: IObject, data: IObject, add?: IObject): IObject {
    const to: IObject = add ? filter : {}, forStyle = add || filter, { animateExcludes } = State
    for (let key in forStyle) {
        if (!animateExcludes[key]) to[key] = data[key]
    }
    return to
}

function getFromStyle(leaf: IUI, style: IObject): IObject {
    const fromStyle = filterAnimateStyle(style, leaf.__), animate = leaf.animate()
    if (animate && !animate.started) filterAnimateStyle(fromStyle, leaf.__, animate.from)
    return fromStyle
}

function getEase(type: 'easeIn' | 'easeOut', style: IStateStyle, data: IUIData): IStateEase {
    const ease = style.ease === undefined ? data.ease : style.ease
    let stateEase = style[type] === undefined ? data[type] : style[type]
    if (ease && stateEase === undefined) stateEase = ease
    return stateEase
}

function assign(style: IStateStyle, stateStyle: IStateStyle): boolean {
    Object.assign(style, stateStyle)
    return true
}