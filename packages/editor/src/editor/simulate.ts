import { IGroup, ILeaf } from '@leafer-ui/interface'
import { Bounds } from '@leafer-ui/draw'

import { IEditor } from '@leafer-in/interface'


const bounds = new Bounds()

export function simulate(editor: IEditor) {
    const { simulateTarget, list } = editor
    const { zoomLayer } = list[0].leafer.zoomLayer as IGroup // follow zoomLayer zoom / move
    simulateTarget.safeChange(() => {
        bounds.setListWithFn(list, (leaf: ILeaf) => leaf.getBounds('box', 'page'))
        if (bounds.width === 0) bounds.width = 0.1 // fix
        if (bounds.height === 0) bounds.height = 0.1
        simulateTarget.reset(bounds.get())
    })
    zoomLayer.add(simulateTarget)
}