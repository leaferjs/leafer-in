import { ILeaferBase } from '@leafer-ui/interface'

import { addInteractionWindow } from './window'


export function design(leafer: ILeaferBase): void {
    addInteractionWindow(leafer, {
        zoom: {
            min: 0.01,
            max: 256
        },
        move: {
            holdSpaceKey: true,
            holdMiddleKey: true,
        }
    })
}
