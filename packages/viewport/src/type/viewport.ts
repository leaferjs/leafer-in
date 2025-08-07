import { ILeaferBase, ILeaferConfig } from '@leafer-ui/interface'

import { MoveEvent, ZoomEvent, DataHelper, LeafHelper } from '@leafer-ui/core'


export function addViewport(leafer: ILeaferBase, mergeConfig?: ILeaferConfig, custom?: boolean): void {
    addViewportConfig(leafer.parentApp ? leafer.parentApp : leafer, mergeConfig)
    if (leafer.isApp || custom) return

    leafer.__eventIds.push(
        leafer.on_(MoveEvent.BEFORE_MOVE, (e: MoveEvent) => {
            leafer.zoomLayer.move(leafer.getValidMove(e.moveX, e.moveY, false))
        }),
        leafer.on_(MoveEvent.END, (e: MoveEvent) => {
            LeafHelper.animateMove(leafer.zoomLayer, leafer.getValidMove(e.moveX, e.moveY))
        }),
        leafer.on_(ZoomEvent.BEFORE_ZOOM, (e: ZoomEvent) => {
            const { zoomLayer } = leafer
            const changeScale = leafer.getValidScale(e.scale)
            if (changeScale !== 1) zoomLayer.scaleOfWorld(e, changeScale)
        })
    )
}

export function addViewportConfig(leafer: ILeaferBase, mergeConfig?: ILeaferConfig): void {
    const viewportConfig: ILeaferConfig = {
        wheel: { preventDefault: true },
        touch: { preventDefault: true },
        pointer: { preventDefaultMenu: true }
    }
    if (mergeConfig) DataHelper.assign(viewportConfig, mergeConfig)
    DataHelper.assign(leafer.config, viewportConfig, leafer.userConfig)
}