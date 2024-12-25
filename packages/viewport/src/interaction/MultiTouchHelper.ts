import { IMultiTouchData, IKeepTouchData } from '@leafer-ui/interface'

import { PointHelper } from '@leafer-ui/core'


export const MultiTouchHelper = {

    getData(list: IKeepTouchData[]): IMultiTouchData {
        const a = list[0], b = list[1]
        const lastCenter = PointHelper.getCenter(a.from, b.from)
        const center = PointHelper.getCenter(a.to, b.to)
        const move = { x: center.x - lastCenter.x, y: center.y - lastCenter.y }

        const lastDistance = PointHelper.getDistance(a.from, b.from)
        const distance = PointHelper.getDistance(a.to, b.to)
        const scale = distance / lastDistance

        const rotation = PointHelper.getRotation(a.from, b.from, a.to, b.to)

        return { move, scale, rotation, center }
    }

}