import { ILeaf } from '@leafer-ui/interface'
import { State } from '@leafer-ui/core'


export function hasFixedState(leaf: ILeaf): boolean {
    return leaf.selected || leaf.disabled || State.isFocus(leaf)
}

export function restoreStyle(leaf: ILeaf) {
    const style = leaf.__.normalStyle
    if (style) {
        leaf.set(style)
        leaf.__.normalStyle = undefined
    }
}