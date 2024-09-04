import { IUI } from '@leafer-ui/interface'
import { PointerEvent } from '@leafer-ui/core'

import { setPointerState } from './set'
import { unsetPointerState } from './unset'


export function updateEventStyle(leaf: IUI, eventType: string): void {
    switch (eventType) {
        case PointerEvent.ENTER:
            setPointerState(leaf, 'hoverStyle')
            break
        case PointerEvent.LEAVE:
            unsetPointerState(leaf, 'hoverStyle')
            break
        case PointerEvent.DOWN:
            setPointerState(leaf, 'pressStyle')
            break
        case PointerEvent.UP:
            unsetPointerState(leaf, 'pressStyle')
            break
    }
}