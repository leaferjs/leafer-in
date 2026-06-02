import { IPointData, IAround, IAlign, IUI, ILayoutBoundsData, IBoundsType } from '@leafer-ui/interface'
import { AroundHelper, MathHelper, PointHelper, Direction9, isNumber } from '@leafer-ui/draw'
import { DragBoundsHelper } from '@leafer-ui/core'

import { IEditorScaleEvent, IEditorSkewEvent, IEditorRotateEvent } from '@leafer-in/interface'


const { topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left } = Direction9
const { toPoint } = AroundHelper, { within, sign } = MathHelper, { abs } = Math

export const EditDataHelper = {

    getScaleData(target: IUI, startBounds: ILayoutBoundsData, direction: Direction9, totalMoveOrScale: IPointData | number, lockRatio: boolean | 'corner', around: IAround, flipable: boolean, scaleMode: boolean, boundsType: IBoundsType): IEditorScaleEvent {
        let align: IAlign, origin = {} as IPointData, scaleX: number = 1, scaleY: number = 1, lockScale: number

        const { widthRange, heightRange, dragBounds, worldTransform, boxBounds } = target
        const { width, height } = startBounds
        const innerBounds = target.getBounds(boundsType, 'inner')

        // 获取已经改变的比例
        const originChangedScaleX = target.scaleX / startBounds.scaleX
        const originChangedScaleY = target.scaleY / startBounds.scaleY
        const signX = sign(originChangedScaleX)
        const signY = sign(originChangedScaleY)

        const changedScaleX = scaleMode ? originChangedScaleX : signX * innerBounds.width / width
        const changedScaleY = scaleMode ? originChangedScaleY : signY * innerBounds.height / height

        if (isNumber(totalMoveOrScale)) {

            scaleX = scaleY = Math.sqrt(totalMoveOrScale)

        } else {

            if (around) {
                totalMoveOrScale.x *= 2
                totalMoveOrScale.y *= 2
            }

            totalMoveOrScale.x *= scaleMode ? originChangedScaleX : signX
            totalMoveOrScale.y *= scaleMode ? originChangedScaleY : signY

            const topScale = (-totalMoveOrScale.y + height) / height
            const rightScale = (totalMoveOrScale.x + width) / width
            const bottomScale = (totalMoveOrScale.y + height) / height
            const leftScale = (-totalMoveOrScale.x + width) / width

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
                    switch (direction) {
                        case top:
                        case bottom:
                            scaleX = scaleY
                            break
                        case left:
                        case right:
                            scaleY = scaleX
                            break
                        default:
                            lockScale = Math.sqrt(abs(scaleX * scaleY))
                            scaleX = sign(scaleX) * lockScale
                            scaleY = sign(scaleY) * lockScale
                    }
                }
            }

        }

        const useScaleX = scaleX !== 1, useScaleY = scaleY !== 1

        if (useScaleX) scaleX /= changedScaleX
        if (useScaleY) scaleY /= changedScaleY

        if (!flipable) {
            const { worldTransform } = target
            if (scaleX < 0) scaleX = 1 / innerBounds.width / worldTransform.scaleX
            if (scaleY < 0) scaleY = 1 / innerBounds.height / worldTransform.scaleY
        }

        // 检查限制

        toPoint(around || align, innerBounds, origin, true)

        this.checkOrigin(target, origin, boundsType)

        if (dragBounds) {
            const scaleData = { x: scaleX, y: scaleY }
            DragBoundsHelper.limitScaleOf(target, origin, scaleData, lockRatio as boolean)
            scaleX = scaleData.x
            scaleY = scaleData.y
        }

        if (useScaleX && widthRange) {
            const nowWidth = innerBounds.width * target.scaleX
            scaleX = within(nowWidth * scaleX, widthRange) / nowWidth
        }

        if (useScaleY && heightRange) {
            const nowHeight = innerBounds.height * target.scaleY
            scaleY = within(nowHeight * scaleY, heightRange) / nowHeight
        }

        // 防止小于1px
        let minWidth = 1 * abs(worldTransform.scaleX), minHeight = 1 * abs(worldTransform.scaleY)

        if (boundsType !== 'box') {
            minWidth += innerBounds.width - boxBounds.width
            minHeight += innerBounds.height - boxBounds.height
        }

        if (useScaleX && abs(scaleX * innerBounds.width) < minWidth) scaleX = sign(scaleX) * minWidth / innerBounds.width
        if (useScaleY && abs(scaleY * innerBounds.height) < minHeight) scaleY = sign(scaleY) * minHeight / innerBounds.height

        if (lockRatio && scaleX !== scaleY) {
            lockScale = Math.min(abs(scaleX), abs(scaleY))
            scaleX = sign(scaleX) * lockScale
            scaleY = sign(scaleY) * lockScale
        }

        isFinite(scaleX) || (scaleX = 1)
        isFinite(scaleY) || (scaleY = 1)

        return { origin, scaleX, scaleY, direction, lockRatio, around }
    },

    getRotateData(target: IUI, direction: Direction9, current: IPointData, last: IPointData, around: IAround, boundsType: IBoundsType): IEditorRotateEvent {
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

        toPoint(around || align, target.getBounds(boundsType, 'inner'), origin, true)

        this.checkOrigin(target, origin, boundsType)

        return { origin, rotation: PointHelper.getRotation(last, target.getWorldPointByBox(origin), current) }
    },

    getSkewData(target: IUI, direction: Direction9, move: IPointData, around: IAround, boundsType: IBoundsType,): IEditorSkewEvent {
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

        const innerBounds = target.getBounds(boundsType, 'inner')
        const { width, height } = innerBounds

        last.x = last.x * width
        last.y = last.y * height

        toPoint(around || align, innerBounds, origin, true)

        this.checkOrigin(target, origin, boundsType)

        const rotation = PointHelper.getRotation(last, origin, { x: last.x + (skewX ? move.x : 0), y: last.y + (skewY ? move.y : 0) })
        skewX ? skewX = -rotation : skewY = rotation

        return { origin, skewX, skewY }
    },


    checkOrigin(target: IUI, origin: IPointData, boundsType: IBoundsType): void {
        if (boundsType !== 'box') {
            const { boxBounds } = target, innerBounds = target.getBounds(boundsType, 'inner')
            origin.x += innerBounds.x - boxBounds.x
            origin.y += innerBounds.y - boxBounds.y
        }
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