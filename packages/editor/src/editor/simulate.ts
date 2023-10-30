import { IGroup, ILeaf } from '@leafer-ui/interface'
import { IEditor } from '@leafer-in/interface'

import { Bounds } from '@leafer-ui/core'


export function simulate(editor: IEditor) {
    const { targetSimulate: simulateTarget, targetList } = editor
    const { x, y, width, height } = new Bounds().setByListWithHandle(targetList.list, (leaf: ILeaf) => leaf.worldBoxBounds)

    const parent = simulateTarget.parent = targetList.list[0].leafer.zoomLayer as IGroup
    const { scaleX, scaleY, e: worldX, f: worldY } = parent.__world
    simulateTarget.reset({ x: (x - worldX) / scaleX, y: (y - worldY) / scaleY, width: width / scaleX, height: height / scaleY })
}