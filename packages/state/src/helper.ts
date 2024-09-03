import { IUI, IObject, IUIInputData, IStateStyle, IScaleData } from '@leafer-ui/interface'
import { State, MathHelper } from '@leafer-ui/core'


export function hasFixedState(leaf: IUI): boolean {
    return leaf.disabled
}

export function assignScale(style: IStateStyle): void {
    MathHelper.assignScale(style as IScaleData, style.scale)
    delete style.scale
}

export function restoreStyle(leaf: IUI) {
    const { normalStyle } = leaf.__
    if (normalStyle) leaf.set(normalStyle, true)
}

export function findStyle(find: IObject, data: IObject, findAdd?: IObject): IObject {
    const to: IObject = findAdd ? find : {}
    const forStyle = findAdd || find

    for (let key in forStyle) to[key] = data[key]
    return to
}

export function getFromStyle(leaf: IUI, style: IObject): IObject {
    const fromStyle = findStyle(style, leaf.__)
    const animate = leaf.animate()
    if (animate && !animate.started) findStyle(fromStyle, leaf.__, animate.from)
    return fromStyle
}

export function getStatesStyle(leaf: IUI): IObject {

    //  states < selected < focus < hover < press < disabled 从低到高的依次覆盖

    const data = leaf.__, { state } = data
    const style: IUIInputData = {}, stateStyle = state && data.states[state]
    let hasState: boolean

    if (stateStyle) hasState = true, Object.assign(style, stateStyle)

    const selectedStyle = style.selectedStyle || data.selectedStyle
    if (selectedStyle && data.selected) hasState = true, Object.assign(style, selectedStyle)

    if (data.disabled) {

        const disabledStyle = style.disabledStyle || data.disabledStyle
        if (disabledStyle) hasState = true, Object.assign(style, disabledStyle)

    } else {

        const focusStyle = style.focusStyle || data.focusStyle
        if (focusStyle && State.isFocus(leaf)) hasState = true, Object.assign(style, focusStyle)

        const hoverStyle = style.hoverStyle || data.hoverStyle
        if (hoverStyle && State.isHover(leaf)) hasState = true, Object.assign(style, hoverStyle)

        const pressStyle = style.pressStyle || data.pressStyle
        if (pressStyle && State.isPress(leaf)) hasState = true, Object.assign(style, pressStyle)

    }

    return hasState ? style : null
}