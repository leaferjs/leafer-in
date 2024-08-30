import { IUI } from '@leafer-ui/interface'
import { State } from '@leafer-ui/core'


export function hasFixedState(leaf: IUI): boolean {
    return leaf.selected || leaf.disabled || State.isFocus(leaf)
}

export function restoreStyle(leaf: IUI) {
    const style = leaf.__.normalStyle
    if (style) {
        const { easeOut } = style

        if (easeOut) {
            delete style.easeOut
            leaf.animate(style, easeOut as any)
        } else {
            leaf.killAnimate()
            leaf.set(style)
        }

        leaf.__.normalStyle = undefined
    }
}