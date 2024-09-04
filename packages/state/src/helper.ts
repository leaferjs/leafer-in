import { IUI } from '@leafer-ui/interface'


export function findParentButton(leaf: IUI, button?: IUI | boolean): IUI {
    if (button && button !== true) return button
    if (!leaf.button) {
        let { parent } = leaf
        for (let i = 0; i < 2; i++) {
            if (parent) {
                if (parent.__.button) return parent
                parent = parent.parent
            }
        }
    }
    return null
}