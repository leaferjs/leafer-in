import { IUI } from '@leafer-ui/interface'
import { PointerEvent } from '@leafer-ui/core'

import { setStateStyle } from './set'
import { unsetStateStyle } from './unset'


export function updateEventStyle(leaf: IUI, eventType: string): void {
    switch (eventType) {
        case PointerEvent.ENTER:
            setStateStyle(leaf, 'hoverStyle', true)
            break
        case PointerEvent.LEAVE:
            unsetStateStyle(leaf, 'hoverStyle', true)
            break
        case PointerEvent.DOWN:
            setStateStyle(leaf, 'pressStyle', true)
            break
        case PointerEvent.UP:
            unsetStateStyle(leaf, 'pressStyle', true)
            break
    }
}