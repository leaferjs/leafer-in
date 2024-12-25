import { ILeaferBase } from '@leafer-ui/interface'

import { addViewport } from './viewport'


export function design(leafer: ILeaferBase): void {
    addViewport(leafer, {
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
