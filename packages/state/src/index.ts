export { stateType, stateStyleType } from './decorator'

import { IUI, IStateStyleType, IStateName, IText, IUIInputData, ITransition } from '@leafer-ui/interface'
import { State, UI, Text, dataType, Plugin, getDescriptor, doBoundsType, defineKey } from '@leafer-ui/core'

import { setPointerState, setState } from './set'
import { unsetPointerState, unsetState } from './unset'
import { updateEventStyle } from './event'
import { checkPointerState, checkFixedState, checkState } from './check'
import { getStyle, updateStyle } from './style'
import { stateType, stateStyleType } from './decorator'


Plugin.add('state')


State.animateExcludes = {
    animation: 1,
    animationOut: 1,

    transition: 1,
    transitionOut: 1,

    states: 1,
    state: 1,

    placeholder: 1,

    normalStyle: 1,
    hoverStyle: 1,
    pressStyle: 1,
    focusStyle: 1,
    selectedStyle: 1,
    disabledStyle: 1,
    placeholderStyle: 1
}


State.isState = function (state: IStateName, leaf: IUI, button?: IUI | boolean): boolean { return checkState(state, leaf, button) }
State.isSelected = function (leaf: IUI, button?: IUI | boolean): boolean { return checkFixedState('selected', leaf, button) }
State.isDisabled = function (leaf: IUI, button?: IUI | boolean): boolean { return checkFixedState('disabled', leaf, button) }

State.isFocus = function (leaf: IUI, button?: IUI | boolean): boolean { return checkPointerState('isFocus', leaf, button) }
State.isHover = function (leaf: IUI, button?: IUI | boolean): boolean { return checkPointerState('isHover', leaf, button) }
State.isPress = function (leaf: IUI, button?: IUI | boolean): boolean { return checkPointerState('isPress', leaf, button) }
State.isPlacehold = function (leaf: IUI, _button?: IUI | boolean): boolean { return (leaf as IText).__.__isPlacehold }

State.isDrag = function (leaf: IUI, button?: IUI | boolean): boolean { return checkPointerState('isDrag', leaf, button) }

State.setStyleName = function (leaf: IUI, stateType: IStateStyleType, value: boolean): void { value ? setState(leaf, stateType, leaf[stateType]) : unsetState(leaf, stateType, leaf[stateType]) }
State.set = function (leaf: IUI, stateName: string): void { const style = leaf.states[stateName]; style ? setState(leaf, stateName, style) : unsetState(leaf, stateName, style) }

State.getStyle = getStyle
State.updateStyle = updateStyle
State.updateEventStyle = updateEventStyle


const ui = UI.prototype

// addAttr
UI.addAttr('selected', false, stateType, 'selectedStyle')
UI.addAttr('disabled', false, stateType, 'disabledStyle')

UI.addAttr('states', {}, stateStyleType)
UI.addAttr('state', '', stateType)

UI.addAttr('normalStyle', undefined, dataType)
UI.addAttr('hoverStyle', undefined, stateStyleType)
UI.addAttr('pressStyle', undefined, stateStyleType)
UI.addAttr('focusStyle', undefined, stateStyleType)
UI.addAttr('selectedStyle', undefined, stateStyleType)
UI.addAttr('disabledStyle', undefined, stateStyleType)
UI.addAttr('placeholderStyle', undefined, stateStyleType)

UI.addAttr('button', false, dataType)

// @leafer-in/animate will rewrite
ui.set = function (data: IUIInputData, transition?: ITransition | 'temp'): void {
    if (data) {
        if (transition) {
            if (transition === 'temp') {
                this.lockNormalStyle = true
                Object.assign(this, data)
                this.lockNormalStyle = false
            } else this.animate(data, transition)
        } else Object.assign(this, data)
    }
}

ui.focus = function (value: boolean = true): void {
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

ui.updateState = function (): void {
    State.updateStyle(this, undefined, 'in')
}


const text = Text.prototype, textKey = 'text'

defineKey(text, textKey, {
    ...getDescriptor(text, textKey),
    set(value: string) {
        const t = this as Text, oldValue = t.text
        if (t.__setAttr(textKey, value)) {
            doBoundsType(t)
            if (t.placeholderStyle && t.placeholder && (oldValue === '' || value === '')) t.__layout.stateStyleChanged = true
        }
    }
})
