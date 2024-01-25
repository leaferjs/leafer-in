import { IGroup, ILeaf } from '@leafer-ui/interface'
import { Bounds } from '@leafer-ui/core'

import { IEditor } from '@leafer-in/interface'


export function simulate(editor: IEditor) {
    const { simulateTarget, leafList: targetList } = editor
    const { x, y, width, height } = new Bounds().setListWithFn(targetList.list, (leaf: ILeaf) => leaf.worldBoxBounds)

    const parent = simulateTarget.parent = targetList.list[0].leafer.zoomLayer as IGroup // follow zoomLayer zoom / move
    const { scaleX, scaleY, e: worldX, f: worldY } = parent.__world
    simulateTarget.reset({ x: (x - worldX) / scaleX, y: (y - worldY) / scaleY, width: width / scaleX, height: height / scaleY })
}