import { IUI, IObject, IUIInputData, IStateStyle, IScaleData, ITransition } from '@leafer-ui/interface'
import { State, MathHelper, isNull } from '@leafer-ui/core'

import { findParentButton } from './helper'


export function setStyle(leaf: IUI, style: IStateStyle): void {
    if (typeof style !== 'object') style = undefined
    updateStyle(leaf, style, 'in')
}

export function unsetStyle(leaf: IUI, style?: IStateStyle): void {
    const { normalStyle } = leaf
    if (typeof style !== 'object') style = undefined
    if (normalStyle) {
        if (!style) style = normalStyle
        updateStyle(leaf, style, 'out')
    }
}

const emprtyStyle = {}

export function updateStyle(leaf: IUI, style?: IStateStyle, type?: 'in' | 'out'): void {
    const { normalStyle } = leaf

    if (!style) style = emprtyStyle

    if (style.scale) {
        MathHelper.assignScale(style as IScaleData, style.scale)
        delete style.scale
    }

    if (style === emprtyStyle || !State.canAnimate) type = null
    let transition = type ? getTransition(type, style, leaf) : false
    const fromStyle = transition ? getFromStyle(leaf, style) : undefined

    // 回到正常状态
    const nextStyle = State.canAnimate && getStyle(leaf)
    if (nextStyle) leaf.killAnimate('transition')
    if (normalStyle) leaf.set(normalStyle, 'temp')


    const statesStyle = getStyle(leaf) // 必须在回到正常状态之后获取
    if (statesStyle) {

        const { animation } = statesStyle
        if (animation) {
            const animate = leaf.animate(animation, undefined, 'animation', true)
            Object.assign(statesStyle, animate.endingStyle) // 加上最终的动画样式

            if (type !== 'in' || style.animation !== animation) animate.kill()
            else transition = false

            delete statesStyle.animation
        }


        leaf.normalStyle = filterStyle(statesStyle, leaf)
        leaf.set(statesStyle, 'temp')
    } else {
        leaf.normalStyle = undefined
    }

    if (transition) {
        const toStyle = filterStyle(fromStyle, leaf)
        leaf.set(fromStyle, 'temp')
        leaf.animate([fromStyle, toStyle], transition, 'transition', true)
    }

    leaf.__layout.stateStyleChanged = false
}

export function getStyle(leaf: IUI): IStateStyle {

    //   从低到高依次覆盖:  states < selected < placeholder < focus < hover < press < disabled

    let exist: boolean
    const style: IUIInputData = {}, button = findParentButton(leaf)
    const state = button ? (leaf.state || button.state) : leaf.state

    const stateStyle = state && leaf.states[state]
    if (stateStyle && State.isState(state, leaf, button)) exist = assign(style, stateStyle)

    const selectedStyle = style.selectedStyle || leaf.selectedStyle
    if (selectedStyle && State.isSelected(leaf, button)) exist = assign(style, selectedStyle)

    const placeholderStyle = style.placeholderStyle || leaf.placeholderStyle
    if (placeholderStyle && State.isPlaceholder(leaf, button)) exist = assign(style, placeholderStyle)

    if (State.isDisabled(leaf, button)) {

        const disabledStyle = style.disabledStyle || leaf.disabledStyle
        if (disabledStyle) exist = assign(style, disabledStyle)

    } else {

        const focusStyle = style.focusStyle || leaf.focusStyle
        if (focusStyle && State.isFocus(leaf, button)) exist = assign(style, focusStyle)

        const hoverStyle = style.hoverStyle || leaf.hoverStyle
        if (hoverStyle && State.isHover(leaf, button)) exist = assign(style, hoverStyle)

        const pressStyle = style.pressStyle || leaf.pressStyle
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
    const fromStyle = filterAnimateStyle(style, leaf), animate = leaf.animate()
    if (animate) filterAnimateStyle(fromStyle, leaf, animate.fromStyle)
    return fromStyle
}

function getTransition(type: 'in' | 'out', style: IStateStyle, data: IUI): ITransition {
    let name: 'transition' | 'transitionOut' = type === 'in' ? 'transition' : 'transitionOut'
    if (type === 'out' && isNull(data[name]) && isNull(style[name])) name = 'transition'
    return isNull(style[name]) ? data[name] : style[name]
}

function assign(style: IStateStyle, stateStyle: IStateStyle): boolean {
    Object.assign(style, stateStyle)
    return true
}