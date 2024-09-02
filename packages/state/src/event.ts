import { IUI } from '@leafer-ui/interface'
import { PointerEvent } from '@leafer-ui/core'

import { setPointerStateStyle } from './set'
import { unsetPointerStateStyle } from './unset'


export function updateEventStyle(leaf: IUI, eventType: string): void {
    switch (eventType) {
        case PointerEvent.ENTER:
            setPointerStateStyle(leaf, 'hoverStyle')
            break
        case PointerEvent.LEAVE:
            unsetPointerStateStyle(leaf, 'hoverStyle')
            break
        case PointerEvent.DOWN:
            setPointerStateStyle(leaf, 'pressStyle')
            break
        case PointerEvent.UP:
            unsetPointerStateStyle(leaf, 'pressStyle')
            break
    }
}