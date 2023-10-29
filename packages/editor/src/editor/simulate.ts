import { IGroup, ILeaf } from '@leafer-ui/interface'
import { IEditor } from '@leafer-in/interface'

import { Bounds } from '@leafer-ui/core'


export function simulate(editor: IEditor) {
    const { targetSimulate: simulateTarget, targetList: list } = editor
    const { x, y, width, height } = new Bounds().setByListWithHandle(list.list, (leaf: ILeaf) => leaf.worldBoxBounds)

    const parent = simulateTarget.parent = list.list[0].leafer.zoomLayer as IGroup
    const { scaleX, scaleY, e: worldX, f: worldY } = parent.__world
    simulateTarget.reset({ x: x - worldX, y: y - worldY, width: width / scaleX, height: height / scaleY })
}