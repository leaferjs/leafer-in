import { IBoundsData, IPointData, IAround } from '@leafer-ui/interface'
import { AroundHelper, PointHelper, Direction9 } from '@leafer-ui/draw'

import { IEditorScaleEvent, IEditorSkewEvent, IEditorRotateEvent } from '@leafer-in/interface'


const { topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left } = Direction9
const { toPoint } = AroundHelper

export const EditDataHelper = {

    getScaleData(bounds: IBoundsData, direction: Direction9, pointMove: IPointData, lockRatio: boolean | 'corner', around: IAround): IEditorScaleEvent {
        let origin: IPointData, scaleX: number = 1, scaleY: number = 1
        const { width, height } = bounds

        if (around) {
            pointMove.x *= 2
            pointMove.y *= 2
        }

        // 防止变为0
        if (Math.abs(pointMove.x) === width) pointMove.x += 0.1
        if (Math.abs(pointMove.y) === height) pointMove.y += 0.1

        const topScale = (-pointMove.y + height) / height
        const rightScale = (pointMove.x + width) / width
        const bottomScale = (pointMove.y + height) / height
        const leftScale = (-pointMove.x + width) / width

        switch (direction) {
            case top:
                scaleY = topScale
                origin = { x: 0.5, y: 1 }
                break
            case right:
                scaleX = rightScale
                origin = { x: 0, y: 0.5 }
                break
            case bottom:
                scaleY = bottomScale
                origin = { x: 0.5, y: 0 }
                break
            case left:
                scaleX = leftScale
                origin = { x: 1, y: 0.5 }
                break
            case topLeft:
                scaleY = topScale
                scaleX = leftScale
                origin = { x: 1, y: 1 }
                break
            case topRight:
                scaleY = topScale
                scaleX = rightScale
                origin = { x: 0, y: 1 }
                break
            case bottomRight:
                scaleY = bottomScale
                scaleX = rightScale
                origin = { x: 0, y: 0 }
                break
            case bottomLeft:
                scaleY = bottomScale
                scaleX = leftScale
                origin = { x: 1, y: 0 }
        }

        if (lockRatio) {
            const unlockSide = lockRatio === 'corner' && direction % 2
            if (!unlockSide) scaleX = scaleY = Math.sqrt(scaleX * scaleY)
        }

        toPoint(around || origin, bounds, origin)

        return { origin, scaleX, scaleY, direction, lockRatio, around }
    },

    getRotateData(bounds: IBoundsData, direction: Direction9, current: IPointData, last: IPointData, around: IAround): IEditorRotateEvent {
        let origin: IPointData

        switch (direction) {
            case topLeft:
                origin = { x: 1, y: 1 }
                break
            case topRight:
                origin = { x: 0, y: 1 }
                break
            case bottomRight:
                origin = { x: 0, y: 0 }
                break
            case bottomLeft:
                origin = { x: 1, y: 0 }
                break
            default:
                origin = { x: 0.5, y: 0.5 }
        }

        toPoint(around || origin, bounds, origin)

        return { origin, rotation: PointHelper.getRotation(last, origin, current) }
    },

    getSkewData(bounds: IBoundsData, direction: Direction9, move: IPointData, around: IAround): IEditorSkewEvent {
        let origin: IPointData, skewX = 0, skewY = 0
        let last: IPointData

        switch (direction) {
            case top:
                last = { x: 0.5, y: 0 }
                origin = { x: 0.5, y: 1 }
                skewX = 1
                break
            case bottom:
                last = { x: 0.5, y: 1 }
                origin = { x: 0.5, y: 0 }
                skewX = 1
                break
            case left:
                last = { x: 0, y: 0.5 }
                origin = { x: 1, y: 0.5 }
                skewY = 1
                break
            case right:
                last = { x: 1, y: 0.5 }
                origin = { x: 0, y: 0.5 }
                skewY = 1
        }

        const { x, y, width, height } = bounds

        last.x = x + last.x * width
        last.y = y + last.y * height

        toPoint(around || origin, bounds, origin)

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