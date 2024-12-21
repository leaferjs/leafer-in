import { ILeaferBase, IPointData, ILeaferConfig } from '@leafer-ui/interface'

import { MoveEvent, ZoomEvent, PointHelper, DataHelper } from '@leafer-ui/core'


export function addInteractionWindow(leafer: ILeaferBase, mergeConfig?: ILeaferConfig): void {
    addInteractionWindowConfig(leafer.parentApp ? leafer.parentApp : leafer, mergeConfig)
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

export function addInteractionWindowConfig(leafer: ILeaferBase, mergeConfig?: ILeaferConfig): void {
    if (mergeConfig) DataHelper.assign(leafer.config, mergeConfig)
    DataHelper.assign(leafer.config, {
        wheel: { preventDefault: true },
        touch: { preventDefault: true },
        pointer: { preventDefaultMenu: true }
    } as ILeaferConfig, leafer.userConfig)
}