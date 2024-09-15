import { IUI, IObject, IUIInputData, IStateStyle, IScaleData, IUIData, ITransition } from '@leafer-ui/interface'
import { State, MathHelper } from '@leafer-ui/core'

import { findParentButton } from './helper'


export function setStyle(leaf: IUI, style: IStateStyle): void {
    if (typeof style !== 'object') style = undefined
    updateStyle(leaf, style, 'transitionIn')
}

export function unsetStyle(leaf: IUI, style?: IStateStyle): void {
    const { normalStyle } = leaf.__
    if (typeof style !== 'object') style = undefined
    if (normalStyle) {
        if (!style) style = normalStyle
        updateStyle(leaf, style, 'transitionOut')
    }
}

const emprtyStyle = {}

export function updateStyle(leaf: IUI, style?: IStateStyle, transitionType?: 'transitionIn' | 'transitionOut'): void {
    const data = leaf.__, { normalStyle } = data

    if (!style) style = emprtyStyle

    if (style.scale) {
        MathHelper.assignScale(style as IScaleData, style.scale)
        delete style.scale
    }

    if (style === emprtyStyle || !State.canAnimate) transitionType = null
    let transition = transitionType ? getTransition(transitionType, style, data) : false
    const fromStyle = transition ? getFromStyle(leaf, style) : undefined

    // 回到正常状态
    leaf.killAnimate('transition')
    if (normalStyle) leaf.set(normalStyle, true)


    const statesStyle = getStyle(leaf) // 必须在回到正常状态之后获取
    if (statesStyle) {

        const { animation } = statesStyle
        if (animation) {
            const animate = leaf.animate(animation, undefined, 'animation', true)
            Object.assign(statesStyle, animate.endingStyle) // 加上最终的动画样式

            if (transitionType !== 'transitionIn' || style.animation !== animation) animate.kill()
            else transition = false

            delete statesStyle.animation
        }


        data.normalStyle = filterStyle(statesStyle, data)
        leaf.set(statesStyle, true)
    } else {
        data.normalStyle = undefined
    }

    if (transition) {
        const toStyle = filterStyle(fromStyle, data)
        leaf.set(fromStyle, true)
        leaf.animate([fromStyle, toStyle], transition, 'transition', true)
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


function filterStyle(style: IObject, data: IObject, addStyle?: IObject, useAnimateExcludes?: boolean): IObject {
    const to: IObject = addStyle ? style : {}, forStyle = addStyle || style
    for (let key in forStyle) {
        if (useAnimateExcludes) {
            if (!State.animateExcludes[key]) to[key] = data[key]
        } else to[key] = data[key]
    }
    return to
}

function filterAnimateStyle(style: IObject, data: IObject, addStyle?: IObject): IObject {
    return filterStyle(style, data, addStyle, true)
}

function getFromStyle(leaf: IUI, style: IObject): IObject {
    const fromStyle = filterAnimateStyle(style, leaf.__), animate = leaf.animate()
    if (animate) filterAnimateStyle(fromStyle, leaf.__, animate.fromStyle)
    return fromStyle
}

function getTransition(type: 'transitionIn' | 'transitionOut', style: IStateStyle, data: IUIData): ITransition {
    const ease = style.transition === undefined ? data.transition : style.transition
    let stateEase = style[type] === undefined ? data[type] : style[type]
    if (ease && stateEase === undefined) stateEase = ease
    return stateEase
}

function assign(style: IStateStyle, stateStyle: IStateStyle): boolean {
    Object.assign(style, stateStyle)
    return true
}