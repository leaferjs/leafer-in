import { ILeaferBase } from '@leafer-ui/interface'

import { addInteractionWindow } from './window'


export function document(leafer: ILeaferBase): void {
    addInteractionWindow(leafer, {
        zoom: { min: 1 },
        move: { scroll: 'limit' }
    })
}
