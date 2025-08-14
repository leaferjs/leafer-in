import { IPointData, IWheelEvent, IWheelConfig } from '@leafer-ui/interface'

import { MathHelper, Platform } from '@leafer-ui/core'


const { abs, max } = Math, { sign, within } = MathHelper

export const WheelEventHelper = {

    getMove(event: IWheelEvent, config: IWheelConfig): IPointData {
        let { moveSpeed } = config
        let { deltaX, deltaY } = event
        if (event.shiftKey && !deltaX) { // Window
            deltaX = deltaY
            deltaY = 0
        }
        const absX = abs(deltaX), absY = abs(deltaY)
        if (absX > 50) deltaX = max(50, absX / 3) * sign(deltaX)
        if (absY > 50) deltaY = max(50, absY / 3) * sign(deltaY)
        return { x: -deltaX * moveSpeed * 2, y: -deltaY * moveSpeed * 2 }
    },

    getScale(event: IWheelEvent, config: IWheelConfig): number {

        let zoom: boolean
        let scale = 1
        let { zoomMode, zoomSpeed } = config

        const delta = event.deltaY || event.deltaX

        if (zoomMode) {
            // mac 触摸板滚动手势的deltaY是整数, 鼠标滚动/触摸板缩放的deltaY有小数点， firfox鼠标滚动为整数，为18或19的倍数
            // windows 始终是整数
            zoom = (zoomMode === 'mouse') ? true : (!event.deltaX && (Platform.intWheelDeltaY ? Math.abs(delta) > 17 : Math.ceil(delta) !== delta))
            if (event.shiftKey || event.metaKey || event.ctrlKey) zoom = true
        } else {
            zoom = !event.shiftKey && (event.metaKey || event.ctrlKey)
        }

        if (zoom) {
            zoomSpeed = within(zoomSpeed, 0, 1)
            const min = event.deltaY ? config.delta.y : config.delta.x
            scale = within(1 - delta / (min * 4) * zoomSpeed, 0.5, 1.5) // zoomSpeed
        }

        return scale
    }

}