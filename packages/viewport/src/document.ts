import { ILeaferBase } from '@leafer-ui/interface'

import { addViewport } from './viewport'


export function document(leafer: ILeaferBase): void {
    addViewport(leafer, {
        zoom: { min: 1 },
        move: { scroll: 'limit' }
    })
}
