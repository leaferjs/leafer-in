import { IGroup, ILeaf } from '@leafer-ui/interface'
import { Bounds } from '@leafer-ui/draw'

import { IEditor } from '@leafer-in/interface'


const bounds = new Bounds()

export function simulate(editor: IEditor) {
    const { simulateTarget, list } = editor
    const { zoomLayer } = list[0].leafer.zoomLayer as IGroup // follow zoomLayer zoom / move
    simulateTarget.safeChange(() => simulateTarget.reset(bounds.setListWithFn(list, (leaf: ILeaf) => leaf.worldBoxBounds).toInnerOf(zoomLayer.worldTransform).get()))
    zoomLayer.add(simulateTarget)
}