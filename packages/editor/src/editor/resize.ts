import { IBoundsData, IPointData, IMatrixData, IAround } from '@leafer-ui/interface'
import { IEditorResizeEvent, IDirection8 } from '@leafer-in/interface'

import { MatrixHelper } from '@leafer-ui/core'


const { scaleOfOuter, reset } = MatrixHelper
const { topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left } = IDirection8
const matrix = {} as IMatrixData

export function getResizeData(old: IBoundsData, direction: IDirection8, move: IPointData, lockRatio: boolean, around: IAround): IEditorResizeEvent {

    if (around) {
        move.x *= 2
        move.y *= 2
    }

    let origin: IPointData, scaleX: number = 1, scaleY: number = 1
    const { x, y, width, height } = old

    const topScale = (-move.y + height) / height
    const rightScale = (move.x + width) / width
    const bottomScale = (move.y + height) / height
    const leftScale = (-move.x + width) / width

    switch (direction) {
        case top:
            scaleY = topScale
            if (lockRatio) scaleX = scaleY
            origin = { x: x + width / 2, y: y + height }
            break
        case right:
            scaleX = rightScale
            if (lockRatio) scaleY = scaleX
            origin = { x, y: y + height / 2 }
            break
        case bottom:
            scaleY = bottomScale
            if (lockRatio) scaleX = scaleY
            origin = { x: x + width / 2, y }
            break
        case left:
            scaleX = leftScale
            if (lockRatio) scaleY = scaleX
            origin = { x: x + width, y: y + height / 2 }
            break
        case topLeft:
            scaleY = topScale
            scaleX = leftScale
            if (lockRatio) scaleX = scaleY
            origin = { x: x + width, y: y + height }
            break
        case topRight:
            scaleY = topScale
            scaleX = rightScale
            if (lockRatio) scaleX = scaleY
            origin = { x, y: y + height }
            break
        case bottomRight:
            scaleY = bottomScale
            scaleX = rightScale
            if (lockRatio) scaleX = scaleY
            origin = { x, y }
            break
        case bottomLeft:
            scaleY = bottomScale
            scaleX = leftScale
            if (lockRatio) scaleX = scaleY
            origin = { x: x + width, y }
            break
    }

    if (around) {
        if (typeof around === 'object') {
            origin = { x: x + width / around.x, y: y + height / around.y }
        } else {
            origin = { x: x + width / 2, y: y + height / 2 }
        }
    }

    reset(matrix)
    scaleOfOuter(matrix, origin, scaleX, scaleY)
    const bounds = { x: old.x + matrix.e, y: old.y + matrix.f, width: width * scaleX, height: height * scaleY }
    return { bounds, old, origin, scaleX, scaleY, direction, lockRatio, around }

}

