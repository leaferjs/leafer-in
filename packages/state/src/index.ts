import { IUI, IStateStyleType, IStateName } from '@leafer-ui/interface'
import { State, UI } from '@leafer-ui/core'

import { setPointerState, setState } from './set'
import { unsetPointerState, unsetState } from './unset'
import { updateEventStyle } from './event'
import { checkPointerState, checkFixedState, checkState } from './check'
import { getStyle, updateStyle } from './style'


State.animateExcludes = {
    animation: 1,

    states: 1,
    state: 1,

    normalStyle: 1,
    hoverStyle: 1,
    pressStyle: 1,
    focusStyle: 1,
    selectedStyle: 1,
    disabledStyle: 1,

    ease: 1,
    easeIn: 1,
    easeOut: 1
}


State.isState = function (state: IStateName, leaf: IUI, button?: IUI | boolean): boolean { return checkState(state, leaf, button) }
State.isSelected = function (leaf: IUI, button?: IUI | boolean): boolean { return checkFixedState('selected', leaf, button) }
State.isDisabled = function (leaf: IUI, button?: IUI | boolean): boolean { return checkFixedState('disabled', leaf, button) }

State.isFocus = function (leaf: IUI, button?: IUI | boolean): boolean { return checkPointerState('isFocus', leaf, button) }
State.isHover = function (leaf: IUI, button?: IUI | boolean): boolean { return checkPointerState('isHover', leaf, button) }
State.isPress = function (leaf: IUI, button?: IUI | boolean): boolean { return checkPointerState('isPress', leaf, button) }

State.isDrag = function (leaf: IUI, button?: IUI | boolean): boolean { return checkPointerState('isDrag', leaf, button) }

State.setStyleName = function (leaf: IUI, stateType: IStateStyleType, value: boolean): void { value ? setState(leaf, stateType, leaf[stateType]) : unsetState(leaf, stateType, leaf[stateType]) }
State.set = function (leaf: IUI, stateName: string): void { const style = leaf.states[stateName]; style ? setState(leaf, stateName, style) : unsetState(leaf, stateName, style) }

State.getStyle = getStyle
State.updateStyle = updateStyle
State.updateEventStyle = updateEventStyle


UI.prototype.focus = function (value: boolean = true): void {
    this.waitLeafer(() => {
        let { focusData } = this.app.interaction
        if (value) {
            if (focusData) focusData.focus(false)
            focusData = this
        } else focusData = null
        this.app.interaction.focusData = focusData
        value ? setPointerState(this, 'focusStyle') : unsetPointerState(this, 'focusStyle')
    })
}

UI.prototype.updateState = function (): void {
    State.updateStyle(this, undefined, 'transitionIn')
}