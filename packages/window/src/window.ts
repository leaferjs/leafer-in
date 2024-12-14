import { ILeaferBase, IPointData } from '@leafer-ui/interface'

import { MoveEvent, ZoomEvent, PointHelper } from '@leafer-ui/core'


export function addInteractionWindow(leafer: ILeaferBase): void {
    if (leafer.isApp) return
    leafer.__eventIds.push(
        leafer.on_(MoveEvent.BEFORE_MOVE, (e: MoveEvent) => {
            leafer.zoomLayer.move(leafer.getValidMove(e.moveX, e.moveY))
        }),
        leafer.on_(ZoomEvent.BEFORE_ZOOM, (e: ZoomEvent) => {
            const { zoomLayer } = leafer
            const changeScale = leafer.getValidScale(e.scale)
            if (changeScale !== 1) {
                PointHelper.scaleOf(zoomLayer as IPointData, e, changeScale)
                zoomLayer.scale = zoomLayer.__.scaleX * changeScale
            }
        })
    )
}