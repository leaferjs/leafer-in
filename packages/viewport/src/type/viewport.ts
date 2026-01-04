import { ILeaferBase, ILeaferConfig } from '@leafer-ui/interface'

import { MoveEvent, ZoomEvent, DataHelper, LeafHelper } from '@leafer-ui/core'

import { getScrollType } from '../helper'


export function addViewport(leafer: ILeaferBase, mergeConfig?: ILeaferConfig, custom?: boolean): void {
    addViewportConfig(leafer.parentApp ? leafer.parentApp : leafer, mergeConfig)
    if (leafer.isApp || custom) return

    leafer.__eventIds.push(
        leafer.on_(MoveEvent.BEFORE_MOVE, (e: MoveEvent) => {
            const move = leafer.getValidMove(e.moveX, e.moveY, false)

            // check limit
            if (getScrollType(leafer).includes('limit')) {
                const testMove = leafer.getValidMove(0, 0)
                if (testMove.x || testMove.y) {
                    const maxX = 100, maxY = 200, resistance = e.moveType === 'drag' ? 0.3 : 0.05

                    if (Math.abs(testMove.x) > maxX) move.x = 0
                    else move.x *= resistance

                    if (Math.abs(testMove.y) > maxY) move.y = 0
                    else move.y *= resistance
                }
            }

            leafer.zoomLayer.move(move)
        }),
        leafer.on_(MoveEvent.DRAG_ANIMATE, () => {
            const testMove = leafer.getValidMove(0, 0)
            if (testMove.x || testMove.y) leafer.interaction.stopDragAnimate()
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