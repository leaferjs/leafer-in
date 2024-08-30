import { IUI, IStateStyleType } from '@leafer-ui/interface'
import { State, UI } from '@leafer-ui/core'

import { setStateStyle } from './set'
import { unsetStateStyle } from './unset'
import { updateEventStyle } from './event'


State.isHover = function (leaf: IUI): boolean { return leaf.leafer && leaf.leafer.interaction.isHover(leaf) }
State.isPress = function (leaf: IUI): boolean { return leaf.leafer && leaf.leafer.interaction.isPress(leaf) }
State.isFocus = function (leaf: IUI): boolean { return leaf.leafer && leaf.leafer.interaction.isFocus(leaf) }
State.isDrag = function (leaf: IUI): boolean { return leaf.leafer && leaf.leafer.interaction.isDrag(leaf) }
State.setStyle = function (leaf: IUI, stateType: IStateStyleType, value: boolean): void { value ? setStateStyle(leaf, stateType) : unsetStateStyle(leaf, stateType) }
State.updateEventStyle = updateEventStyle


UI.prototype.focus = function (value: boolean = true): void {
    this.waitLeafer(() => {
        let { focusData } = this.app.interaction
        if (value) {
            if (focusData) focusData.focus(false)
            focusData = this
        } else {
            focusData = null
        }
        this.app.interaction.focusData = focusData
        State.setStyle(this, 'focusStyle', value)
    })
}