import { ILeaferBase } from '@leafer-ui/interface'

import { addViewport } from './viewport'


export function custom(leafer: ILeaferBase): void {
    addViewport(leafer, null, true)
}
