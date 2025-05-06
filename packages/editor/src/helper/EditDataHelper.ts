import { IBoundsData, IPointData, IAround, IAlign, IUI, ILayoutBoundsData } from '@leafer-ui/interface'
import { AroundHelper, MathHelper, PointHelper, BoundsHelper, Bounds, Direction9 } from '@leafer-ui/draw'

import { IEditorScaleEvent, IEditorSkewEvent, IEditorRotateEvent } from '@leafer-in/interface'


const { topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left } = Direction9
const { toPoint } = AroundHelper
const { within } = MathHelper

export const EditDataHelper = {

    getScaleData(element: IUI, startBounds: ILayoutBoundsData, direction: Direction9, totalMove: IPointData, lockRatio: boolean | 'corner', around: IAround, flipable: boolean, scaleMode: boolean): IEditorScaleEvent {
        let align: IAlign, origin = {} as IPointData, scaleX: number = 1, scaleY: number = 1

        const { boxBounds, widthRange, heightRange, dragBounds, worldBoxBounds } = element
        const { width, height } = startBounds

        if (around) {
            totalMove.x *= 2
            totalMove.y *= 2
        }


        // 获取已经改变的比例
        const originChangedScaleX = element.scaleX / startBounds.scaleX
        const originChangedScaleY = element.scaleY / startBounds.scaleY
        const signX = originChangedScaleX < 0 ? -1 : 1
        const signY = originChangedScaleY < 0 ? -1 : 1

        const changedScaleX = scaleMode ? originChangedScaleX : signX * boxBounds.width / width
        const changedScaleY = scaleMode ? originChangedScaleY : signY * boxBounds.height / height

        totalMove.x *= scaleMode ? originChangedScaleX : signX
        totalMove.y *= scaleMode ? originChangedScaleY : signY

        const topScale = (-totalMove.y + height) / height
        const rightScale = (totalMove.x + width) / width
        const bottomScale = (totalMove.y + height) / height
        const leftScale = (-totalMove.x + width) / width

        switch (direction) {
            case top:
                scaleY = topScale
                align = 'bottom'
                break
            case right:
                scaleX = rightScale
                align = 'left'
                break
            case bottom:
                scaleY = bottomScale
                align = 'top'
                break
            case left:
                scaleX = leftScale
                align = 'right'
                break
            case topLeft:
                scaleY = topScale
                scaleX = leftScale
                align = 'bottom-right'
                break
            case topRight:
                scaleY = topScale
                scaleX = rightScale
                align = 'bottom-left'
                break
            case bottomRight:
                scaleY = bottomScale
                scaleX = rightScale
                align = 'top-left'
                break
            case bottomLeft:
                scaleY = bottomScale
                scaleX = leftScale
                align = 'top-right'
        }

        if (lockRatio) {
            if (lockRatio === 'corner' && direction % 2) {
                lockRatio = false
            } else {
                let scale: number
                switch (direction) {
                    case top:
                    case bottom:
                        scale = scaleY
                        break
                    case left:
                    case right:
                        scale = scaleX
                        break
                    default:
                        scale = Math.sqrt(Math.abs(scaleX * scaleY))
                }
                scaleX = scaleX < 0 ? -scale : scale
                scaleY = scaleY < 0 ? -scale : scale
            }
        }

        const useScaleX = scaleX !== 1, useScaleY = scaleY !== 1

        if (useScaleX) scaleX /= changedScaleX
        if (useScaleY) scaleY /= changedScaleY

        if (!flipable) {
            const { worldTransform } = element
            if (scaleX < 0) scaleX = 1 / boxBounds.width / worldTransform.scaleX
            if (scaleY < 0) scaleY = 1 / boxBounds.height / worldTransform.scaleY
        }

        // 检查限制

        toPoint(around || align, boxBounds, origin, true)

        if (dragBounds) {
            const allowBounds = dragBounds === 'parent' ? element.parent.boxBounds : dragBounds
            const localBounds = new Bounds(element.__localBoxBounds)
            localBounds.scaleOf(element.getLocalPointByInner(origin), scaleX, scaleY)

            if (!BoundsHelper.includes(allowBounds, localBounds)) {
                const realBounds = localBounds.getIntersect(allowBounds)
                const fitScaleX = realBounds.width / localBounds.width, fitScaleY = realBounds.height / localBounds.height
                if (useScaleX) scaleX *= fitScaleX
                if (useScaleY) scaleY *= fitScaleY // 后续需优化带旋转的场景
            }
        }

        if (useScaleX && widthRange) {
            const nowWidth = boxBounds.width * element.scaleX
            scaleX = within(nowWidth * scaleX, widthRange) / nowWidth
        }

        if (useScaleY && heightRange) {
            const nowHeight = boxBounds.height * element.scaleY
            scaleY = within(nowHeight * scaleY, heightRange) / nowHeight
        }

        // 防止小于1px
        if (useScaleX && Math.abs(scaleX * worldBoxBounds.width) < 1) scaleX = (scaleX < 0 ? -1 : 1) / worldBoxBounds.width
        if (useScaleY && Math.abs(scaleY * worldBoxBounds.height) < 1) scaleY = (scaleY < 0 ? -1 : 1) / worldBoxBounds.height

        if (lockRatio && scaleX !== scaleY) scaleY = scaleX = Math.min(scaleX, scaleY)

        return { origin, scaleX, scaleY, direction, lockRatio, around }
    },

    getRotateData(bounds: IBoundsData, direction: Direction9, current: IPointData, last: IPointData, around: IAround): IEditorRotateEvent {
        let align: IAlign, origin = {} as IPointData

        switch (direction) {
            case topLeft:
                align = 'bottom-right'
                break
            case topRight:
                align = 'bottom-left'
                break
            case bottomRight:
                align = 'top-left'
                break
            case bottomLeft:
                align = 'top-right'
                break
            default:
                align = 'center'
        }

        toPoint(around || align, bounds, origin, true)

        return { origin, rotation: PointHelper.getRotation(last, origin, current) }
    },

    getSkewData(bounds: IBoundsData, direction: Direction9, move: IPointData, around: IAround): IEditorSkewEvent {
        let align: IAlign, origin = {} as IPointData, skewX = 0, skewY = 0
        let last: IPointData

        switch (direction) {
            case top:
            case topLeft:
                last = { x: 0.5, y: 0 }
                align = 'bottom'
                skewX = 1
                break
            case bottom:
            case bottomRight:
                last = { x: 0.5, y: 1 }
                align = 'top'
                skewX = 1
                break
            case left:
            case bottomLeft:
                last = { x: 0, y: 0.5 }
                align = 'right'
                skewY = 1
                break
            case right:
            case topRight:
                last = { x: 1, y: 0.5 }
                align = 'left'
                skewY = 1
        }

        const { width, height } = bounds

        last.x = last.x * width
        last.y = last.y * height

        toPoint(around || align, bounds, origin, true)

        const rotation = PointHelper.getRotation(last, origin, { x: last.x + (skewX ? move.x : 0), y: last.y + (skewY ? move.y : 0) })
        skewX ? skewX = -rotation : skewY = rotation

        return { origin, skewX, skewY }
    },


    getAround(around: IAround, altKey: boolean): IAround {
        return (altKey && !around) ? 'center' : around
    },

    getRotateDirection(direction: number, rotation: number, totalDirection = 8): number {
        direction = (direction + Math.round(rotation / (360 / totalDirection))) % totalDirection
        if (direction < 0) direction += totalDirection
        return direction
    },

    getFlipDirection(direction: Direction9, flipedX: boolean, flipedY: boolean): Direction9 {
        if (flipedX) {
            switch (direction) {
                case left: direction = right; break
                case topLeft: direction = topRight; break
                case bottomLeft: direction = bottomRight; break
                case right: direction = left; break
                case topRight: direction = topLeft; break
                case bottomRight: direction = bottomLeft; break
            }
        }

        if (flipedY) {
            switch (direction) {
                case top: direction = bottom; break
                case topLeft: direction = bottomLeft; break
                case topRight: direction = bottomRight; break
                case bottom: direction = top; break
                case bottomLeft: direction = topLeft; break
                case bottomRight: direction = topRight; break
            }
        }

        return direction
    }

}