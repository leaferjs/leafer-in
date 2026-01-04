import { ILeaferBase } from '@leafer-ui/interface'


export function getScrollType(leafer: ILeaferBase): string {
    const { scroll, disabled } = leafer.app.config.move
    return (!scroll || disabled) ? '' : (scroll === true ? 'free' : scroll)
}