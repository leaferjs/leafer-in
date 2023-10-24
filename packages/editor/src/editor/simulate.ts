import { IGroup, ILeaf } from '@leafer-ui/interface'
import { IEditor } from '@leafer-in/interface'

import { Bounds } from '@leafer-ui/core'


export function simulateTarget(editor: IEditor) {
    const { simulateTarget: simulateTarget, list } = editor

    const one = list.length === 1
    const { x, y, width, height } = one ? list[0].boxBounds : new Bounds().setByListWithHandle(list, (leaf: ILeaf) => leaf.worldBoxBounds)

    simulateTarget.parent = one ? list[0].parent : list[0].leafer.zoomLayer as IGroup
    simulateTarget.reset({ x, y, width, height })
    if (one) {
        const { scaleX, scaleY, rotation, skewX, skewY } = list[0]
        simulateTarget.set({ scaleX, scaleY, rotation, skewX, skewY })
    }
}