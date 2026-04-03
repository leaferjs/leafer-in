import { IPathCommandData, IPathCommandDataWithRadius, IPointData } from '@leafer-ui/interface'
import { PathCorner, PointHelper, PathCommandMap as Command, PathNumberCommandLengthMap, isArray, isUndefined, PathCommandDataHelper, BezierHelper, PathConvert } from '@leafer-ui/draw'

import { getCorrectT, getTangentDistance } from './helper'


const { M, L, C, Z } = Command, { abs } = Math
const { getCenterX, getCenterY } = PointHelper
const { arcTo } = PathCommandDataHelper

PathCorner.smooth = function smooth(data: IPathCommandData, cornerRadius: number, _cornerSmoothing?: number): IPathCommandData {

    const radius = (data as any as IPathCommandDataWithRadius).radius // 独立圆角
    if (isNeedConvert(data)) data = PathConvert.toCanvasData(data, true)
    else data = [...data] // 防止C命令修改数据造成污染

    let command: number, lastCommand: number, commandLen
    let i = 0, countCommand = 0, x = 0, y = 0, startX = 0, startY = 0, startR = 0, secondX = 0, secondY = 0, lastX = 0, lastY = 0, r: number, x1: number, y1: number, x2: number, y2: number, toX: number, toY: number
    if (isArray(cornerRadius)) cornerRadius = cornerRadius[0] || 0

    const len = data.length, three = len === 9 // 3个点时可以加大圆角
    const smooth: IPathCommandData = []

    while (i < len) {
        command = data[i]
        r = radius ? (isUndefined(radius[countCommand]) ? cornerRadius : radius[countCommand]) : cornerRadius
        switch (command) {
            case M:  //moveto(x, y)
                startX = lastX = data[i + 1]
                startY = lastY = data[i + 2]
                startR = r
                i += 3
                const end = findEndPoint(data, i)
                switch (data[i]) { // next command
                    case L: // lineTo()
                        secondX = data[i + 1]
                        secondY = data[i + 2]
                        if (three) smooth.push(M, startX, startY)
                        else {
                            if (end) smooth.push(M, getCenterX(startX, secondX), getCenterY(startY, secondY))
                            else smooth.push(M, startX, startY)
                        }
                        break
                    case C: // bezierCurveTo()
                        if (end) {
                            const { left, right } = setAfterC(data, i, r, end.x, end.y, startX, startY, data[i + 1], data[i + 2], data[i + 3], data[i + 4], data[i + 5], data[i + 6])
                            if (left && right) {
                                smooth.push(M, secondX = left[4], secondY = left[5])
                                break
                            }
                        }
                    default:
                        smooth.push(M, secondX = startX, secondY = startY)
                }
                break
            case L:  //lineto(x, y)
                x = data[i + 1]
                y = data[i + 2]
                i += 3
                switch (data[i]) { // next command
                    case L: // lineTo()
                        arcTo(smooth, x, y, data[i + 1], data[i + 2], r, lastX, lastY, three) // use arcTo(x1, y1, x2, y2, radius)
                        break
                    case C: // bezierCurveTo()
                        const { left, right } = setAfterC(data, i, r, lastX, lastY, x, y, data[i + 1], data[i + 2], data[i + 3], data[i + 4], data[i + 5], data[i + 6])
                        if (left && right) arcTo(smooth, x, y, left[4], left[5], r, lastX, lastY, three)
                        else smooth.push(L, x, y)
                        break
                    case Z: // closePath()
                        arcTo(smooth, x, y, startX, startY, r, lastX, lastY, three) // use arcTo(x1, y1, x2, y2, radius)
                        break
                    default:
                        smooth.push(L, x, y)
                }
                lastX = x
                lastY = y
                break
            case C:
                x1 = data[i + 1]
                y1 = data[i + 2]
                x2 = data[i + 3]
                y2 = data[i + 4]
                x = data[i + 5]
                y = data[i + 6]
                i += 7
                switch (data[i]) { // next command
                    case L: // lineTo()
                        toX = data[i + 1], toY = data[i + 2]
                        setBeforeC(smooth, r, lastX, lastY, x1, y1, x2, y2, x, y, toX, toY, three)
                        break
                    case C: //
                        smooth.push(C, x1, y1, x2, y2, x, y)
                        break
                    case Z: // closePath()
                        toX = startX, toY = startY
                        setBeforeC(smooth, r, lastX, lastY, x1, y1, x2, y2, x, y, toX, toY, three)
                        break
                    default:
                        smooth.push(C, x1, y1, x2, y2, x, y)
                }
                lastX = x
                lastY = y
                break
            case Z:  //closepath()
                if (lastCommand !== Z) { // fix: 重复的 Z 导致的问题
                    arcTo(smooth, startX, startY, secondX, secondY, startR, lastX, lastY, three) // use arcTo(x1, y1, x2, y2, radius)
                    smooth.push(Z)
                }
                i += 1
                break
            default:
                commandLen = PathNumberCommandLengthMap[command]
                for (let j = 0; j < commandLen; j++) smooth.push(data[i + j])
                i += commandLen
        }
        lastCommand = command
        countCommand++
    }

    return smooth
}


function isNeedConvert(data: IPathCommandData): boolean {
    let command: number, i = 0
    const len = data.length
    while (i < len) {
        command = data[i]
        switch (command) {
            case M:  //moveto(x, y)
                i += 3
                break
            case L:  //lineto(x, y)
                i += 3
                break
            case C: // bezierCurveTo()
                i += 7
                break
            case Z:  //closepath()
                i += 1
                break
            default:
                return true
        }
    }
    return false
}

function findEndPoint(data: IPathCommandData, i: number): IPointData {
    let command: number, commandLen: number, x: number, y: number
    const len = data.length
    while (i < len) {
        command = data[i]
        switch (command) {
            case M:  //moveto(x, y)
                return undefined
            case L:  //lineto(x, y)
                x = data[i + 1]
                y = data[i + 2]
                i += 3
                break
            case C: // bezierCurveTo()
                x = data[i + 5]
                y = data[i + 6]
                i += 7
                break
            case Z:  //closepath()
                return { x, y }
            default:
                commandLen = PathNumberCommandLengthMap[command]
                i += commandLen
        }
    }
    return undefined
}


function setAfterC(data: IPathCommandData, i: number, cornerRadius: number, lastX: number, lastY: number, fromX: number, fromY: number, x1: number, y1: number, x2: number, y2: number, toX: number, toY: number) {
    let targetX = x1, targetY = y1
    if (isSame(x1, fromX) && isSame(y1, fromY)) {
        targetX = x2; targetY = y2
        if (isSame(x2, fromX) && isSame(y2, fromY)) {
            targetX = toX; targetY = toY
        }
    }

    const d = getTangentDistance(cornerRadius, fromX, fromY, lastX, lastY, targetX, targetY)
    const t = getCorrectT(d, fromX, fromY, x1, y1, x2, y2, toX, toY)
    const two = BezierHelper.cut(t, fromX, fromY, x1, y1, x2, y2, toX, toY)
    const { left, right } = two

    if (left && right) {
        data[i + 1] = right[0]; data[i + 2] = right[1]
        data[i + 3] = right[2]; data[i + 4] = right[3]
    }

    return two
}

function setBeforeC(smooth: IPathCommandData, cornerRadius: number, fromX: number, fromY: number, x1: number, y1: number, x2: number, y2: number, toX: number, toY: number, nextX: number, nextY: number, three: boolean) {
    let targetX = x2, targetY = y2
    if (isSame(targetX, toX) && isSame(targetY, toY)) {
        targetX = x1; targetY = y1
        if (isSame(targetX, toX) && isSame(targetY, toY)) {
            targetX = fromX; targetY = fromY
        }
    }

    const d = getTangentDistance(cornerRadius, toX, toY, targetX, targetY, nextX, nextY) // 反向
    const t = getCorrectT(d, toX, toY, x2, y2, x1, y1, fromX, fromY) // 反向
    const { left, right } = BezierHelper.cut(1 - t, fromX, fromY, x1, y1, x2, y2, toX, toY)

    if (left && right) {
        smooth.push(C, left[0], left[1], left[2], left[3], left[4], left[5])
        arcTo(smooth, toX, toY, nextX, nextY, cornerRadius, left[4], left[5], three)
    } else {
        smooth.push(C, x1, y1, x2, y2, toX, toY)
    }
}


function isSame(a: number, b: number): boolean {
    return abs(a - b) < 0.01
}