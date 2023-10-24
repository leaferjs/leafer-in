import { IBoundsData, IPointData, IMatrixData, IAround } from '@leafer-ui/interface'
import { IEditorResizeEvent, IDirection8, IEditorSkewEvent, IEditorRotateEvent } from '@leafer-in/interface'

import { MatrixHelper, PointHelper } from '@leafer-ui/core'


const { scaleOfOuter, reset } = MatrixHelper
const { topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left } = IDirection8
const matrix = {} as IMatrixData

export function getResizeData(old: IBoundsData, direction: IDirection8, move: IPointData, lockRatio: boolean, around: IAround): IEditorResizeEvent {

    if (around) {
        move.x *= 2
        move.y *= 2
    }

    let origin: IPointData, scaleX: number = 1, scaleY: number = 1
    const { width, height } = old

    const topScale = (-move.y + height) / height
    const rightScale = (move.x + width) / width
    const bottomScale = (move.y + height) / height
    const leftScale = (-move.x + width) / width

    switch (direction) {
        case top:
            scaleY = topScale
            if (lockRatio) scaleX = scaleY
            origin = { x: 0.5, y: 1 }
            break
        case right:
            scaleX = rightScale
            if (lockRatio) scaleY = scaleX
            origin = { x: 0, y: 0.5 }
            break
        case bottom:
            scaleY = bottomScale
            if (lockRatio) scaleX = scaleY
            origin = { x: 0.5, y: 0 }
            break
        case left:
            scaleX = leftScale
            if (lockRatio) scaleY = scaleX
            origin = { x: 1, y: 0.5 }
            break
        case topLeft:
            scaleY = topScale
            scaleX = leftScale
            if (lockRatio) scaleX = scaleY
            origin = { x: 1, y: 1 }
            break
        case topRight:
            scaleY = topScale
            scaleX = rightScale
            if (lockRatio) scaleX = scaleY
            origin = { x: 0, y: 1 }
            break
        case bottomRight:
            scaleY = bottomScale
            scaleX = rightScale
            if (lockRatio) scaleX = scaleY
            origin = { x: 0, y: 0 }
            break
        case bottomLeft:
            scaleY = bottomScale
            scaleX = leftScale
            if (lockRatio) scaleX = scaleY
            origin = { x: 1, y: 0 }
            break
    }

    setOrigin(origin, around, old)

    reset(matrix)
    scaleOfOuter(matrix, origin, scaleX, scaleY)
    const bounds = { x: old.x + matrix.e, y: old.y + matrix.f, width: width * scaleX, height: height * scaleY }
    return { bounds, old, origin, scaleX, scaleY, direction, lockRatio, around }

}


export function getRotateData(bounds: IBoundsData, direction: IDirection8, current: IPointData, last: IPointData, around: IAround): IEditorRotateEvent {
    let origin: IPointData

    if (around) {

        origin = {} as IPointData

    } else {

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
        }

    }

    setOrigin(origin, around, bounds)

    const changeAngle = PointHelper.getChangeAngle(last, origin, current)

    return { origin, rotation: changeAngle }
}

export function getSkewData(bounds: IBoundsData, direction: IDirection8, move: IPointData, around: IAround): IEditorSkewEvent {
    let skewX = 0, skewY = 0
    let origin: IPointData, last: IPointData

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

    setOrigin(origin, around, bounds)

    const changeAngle = PointHelper.getChangeAngle(last, origin, { x: last.x + move.x, y: last.y + move.y })
    if (skewX) {
        skewX = -changeAngle
    } else {
        skewY = changeAngle
    }

    return { origin, skewX, skewY }
}

export function getAround(around: IAround, altKey: boolean): IAround {
    if (altKey && !around) around = 'center'
    return around
}

function setOrigin(origin: IPointData, around: IAround, bounds: IBoundsData,): void {
    const { x, y, width, height } = bounds
    if (around) {
        if (around === 'center') {
            origin.x = 0.5
            origin.y = 0.5
        } else {
            origin.x = around.x
            origin.y = around.y
        }
    }
    origin.x = x + origin.x * width
    origin.y = y + origin.y * height
}