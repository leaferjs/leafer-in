import { IDirection, IPointData, IBoundsData } from '@leafer-ui/interface'
import { AroundHelper, PathCommandDataHelper } from '@leafer-ui/draw'

const { directionData } = AroundHelper
const { moveTo, lineTo } = PathCommandDataHelper

const POLYLINE_X = 0, POLYLINE_Y = 1
const POLYLINE_EPSILON = 0.001
const POLYLINE_MIN_SEGMENT = 4
const POLYLINE_TURN_WEIGHT = 1.5

function getPolylineDirectionIndex(direction: IDirection): number {
    switch (direction) {
        case 'top-left': return 0
        case 'top': return 1
        case 'top-right': return 2
        case 'right': return 3
        case 'bottom-right': return 4
        case 'bottom': return 5
        case 'bottom-left': return 6
        case 'left': return 7
        default: return 8
    }
}

function getPolylinePorts(direction: IDirection, point: IPointData, target: IPointData, bounds: IBoundsData | undefined, targetBounds: IBoundsData | undefined, ports: number[]): number {
    const data = directionData[getPolylineDirectionIndex(direction)]
    const dx = Math.sign(data.x - 0.5), dy = Math.sign(data.y - 0.5)
    const cx = bounds ? bounds.x + bounds.width / 2 : point.x
    const cy = bounds ? bounds.y + bounds.height / 2 : point.y
    const tx = targetBounds ? targetBounds.x + targetBounds.width / 2 : target.x
    const ty = targetBounds ? targetBounds.y + targetBounds.height / 2 : target.y
    const deltaX = tx - cx, deltaY = ty - cy
    const xSign = dx || (deltaX >= 0 ? 1 : -1)
    const ySign = dy || (deltaY >= 0 ? 1 : -1)
    const xPort = POLYLINE_X * 2 + (xSign > 0 ? 1 : 0)
    const yPort = POLYLINE_Y * 2 + (ySign > 0 ? 1 : 0)

    if (dx && !dy) {
        ports[0] = xPort
        return 1
    }

    if (dy && !dx) {
        ports[0] = yPort
        return 1
    }

    if (Math.abs(deltaX) >= Math.abs(deltaY)) {
        ports[0] = xPort
        ports[1] = yPort
    } else {
        ports[0] = yPort
        ports[1] = xPort
    }

    return 2
}

function getPolylineExit(point: IPointData, bounds: IBoundsData | undefined, port: number, clearance: number, result: number[]): void {
    const axis = port >> 1, sign = port & 1 ? 1 : -1

    if (axis === POLYLINE_X) {
        const boundary = bounds ? sign > 0 ? bounds.x + bounds.width : bounds.x : point.x
        result[0] = boundary + sign * clearance
        result[1] = point.y
    } else {
        const boundary = bounds ? sign > 0 ? bounds.y + bounds.height : bounds.y : point.y
        result[0] = point.x
        result[1] = boundary + sign * clearance
    }
}

function isPolylinePointBlocked(x: number, y: number, bounds: IBoundsData | undefined, clearance: number): boolean {
    if (!bounds) return false
    const left = bounds.x - clearance, right = bounds.x + bounds.width + clearance
    const top = bounds.y - clearance, bottom = bounds.y + bounds.height + clearance
    return x > left + POLYLINE_EPSILON && x < right - POLYLINE_EPSILON && y > top + POLYLINE_EPSILON && y < bottom - POLYLINE_EPSILON
}

function isPolylineSegmentBlocked(x1: number, y1: number, x2: number, y2: number, bounds: IBoundsData | undefined, clearance: number): boolean {
    if (!bounds) return false
    const left = bounds.x - clearance, right = bounds.x + bounds.width + clearance
    const top = bounds.y - clearance, bottom = bounds.y + bounds.height + clearance

    if (Math.abs(y1 - y2) <= POLYLINE_EPSILON) {
        return y1 > top + POLYLINE_EPSILON && y1 < bottom - POLYLINE_EPSILON &&
            Math.max(Math.min(x1, x2), left + POLYLINE_EPSILON) < Math.min(Math.max(x1, x2), right - POLYLINE_EPSILON)
    }

    if (Math.abs(x1 - x2) <= POLYLINE_EPSILON) {
        return x1 > left + POLYLINE_EPSILON && x1 < right - POLYLINE_EPSILON &&
            Math.max(Math.min(y1, y2), top + POLYLINE_EPSILON) < Math.min(Math.max(y1, y2), bottom - POLYLINE_EPSILON)
    }

    return true
}

function addPolylineBoundsCoordinates(xs: number[], ys: number[], bounds: IBoundsData | undefined, clearance: number, margin: number): void {
    if (!bounds) return
    const left = bounds.x - clearance, right = bounds.x + bounds.width + clearance
    const top = bounds.y - clearance, bottom = bounds.y + bounds.height + clearance
    xs.push(left, right, left - margin, right + margin)
    ys.push(top, bottom, top - margin, bottom + margin)
}

function sortPolylineCoordinates(values: number[]): void {
    values.sort((a, b) => a - b)
    let write = 0

    for (let i = 0; i < values.length; i++) {
        if (!write || Math.abs(values[i] - values[write - 1]) > POLYLINE_EPSILON) values[write++] = values[i]
    }

    values.length = write
}

function getPolylineCoordinateIndex(values: number[], value: number): number {
    for (let i = 0; i < values.length; i++) {
        if (Math.abs(values[i] - value) <= POLYLINE_EPSILON) return i
    }
    return -1
}

// 根据两端连接方向确定中点转折轴
function getPolylineMidpointAxis(startPort: number, endPort: number, sx: number, sy: number, ex: number, ey: number): number {
    const startAxis = startPort >> 1, endAxis = endPort >> 1
    const startSign = startPort & 1 ? 1 : -1, endSign = endPort & 1 ? 1 : -1

    if (startAxis === endAxis && startSign === -endSign) return startAxis
    return Math.abs(ex - sx) >= Math.abs(ey - sy) ? POLYLINE_X : POLYLINE_Y
}

// 检查中点优先路径
function getPolylineMidpointRoute(result: number[], startPoint: IPointData, endPoint: IPointData, sx: number, sy: number, ex: number, ey: number, midpointAxis: number, startBounds: IBoundsData | undefined, endBounds: IBoundsData | undefined, clearance: number): number {
    const midpointX = (sx + ex) / 2, midpointY = (sy + ey) / 2
    result.length = 0
    result.push(startPoint.x, startPoint.y, sx, sy)

    if (midpointAxis === POLYLINE_X) {
        result.push(midpointX, sy, midpointX, ey)
    } else {
        result.push(sx, midpointY, ex, midpointY)
    }

    result.push(ex, ey, endPoint.x, endPoint.y)

    // 只检查两端出口之间的路径，起终点连接段允许进入自身元素
    for (let i = 4; i < result.length - 2; i += 2) {
        const x1 = result[i - 2], y1 = result[i - 1]
        const x2 = result[i], y2 = result[i + 1]

        if (isPolylineSegmentBlocked(x1, y1, x2, y2, startBounds, clearance) ||
            isPolylineSegmentBlocked(x1, y1, x2, y2, endBounds, clearance)) return Infinity
    }

    return getPolylineScore(result, clearance)
}

function getPolylineRoute(result: number[], startPoint: IPointData, endPoint: IPointData, startPort: number, endPort: number, startBounds: IBoundsData | undefined, endBounds: IBoundsData | undefined, clearance: number): number {
    const startExit: number[] = [], endExit: number[] = []
    getPolylineExit(startPoint, startBounds, startPort, clearance, startExit)
    getPolylineExit(endPoint, endBounds, endPort, clearance, endExit)

    const sx = startExit[0], sy = startExit[1], ex = endExit[0], ey = endExit[1]
    const startAxis = startPort >> 1, endAxis = endPort >> 1
    const startSign = startPort & 1 ? 1 : -1, endSign = endPort & 1 ? 1 : -1
    const startStub = Math.abs(sx - startPoint.x) + Math.abs(sy - startPoint.y)
    const endStub = Math.abs(ex - endPoint.x) + Math.abs(ey - endPoint.y)

    if (isPolylineSegmentBlocked(startPoint.x, startPoint.y, sx, sy, endBounds, clearance) ||
        isPolylineSegmentBlocked(endPoint.x, endPoint.y, ex, ey, startBounds, clearance)) return Infinity

    const midpointAxis = getPolylineMidpointAxis(startPort, endPort, sx, sy, ex, ey)

    // 第一优先级：只要中点路径不受阻，就直接采用
    const midpointScore = getPolylineMidpointRoute(result, startPoint, endPoint, sx, sy, ex, ey, midpointAxis, startBounds, endBounds, clearance)
    if (midpointScore < Infinity) return midpointScore

    // 第二优先级：中点路径受阻，使用网格寻路绕行
    const margin = Math.max(clearance, POLYLINE_MIN_SEGMENT) * 2
    const xs: number[] = [sx, ex, (sx + ex) / 2], ys: number[] = [sy, ey, (sy + ey) / 2]

    addPolylineBoundsCoordinates(xs, ys, startBounds, clearance, margin)
    addPolylineBoundsCoordinates(xs, ys, endBounds, clearance, margin)

    let minX = Math.min(...xs), maxX = Math.max(...xs)
    let minY = Math.min(...ys), maxY = Math.max(...ys)
    xs.push(minX - margin * 2, maxX + margin * 2)
    ys.push(minY - margin * 2, maxY + margin * 2)

    sortPolylineCoordinates(xs)
    sortPolylineCoordinates(ys)

    const nx = xs.length, ny = ys.length
    const startXIndex = getPolylineCoordinateIndex(xs, sx), startYIndex = getPolylineCoordinateIndex(ys, sy)
    const endXIndex = getPolylineCoordinateIndex(xs, ex), endYIndex = getPolylineCoordinateIndex(ys, ey)

    if (startXIndex < 0 || startYIndex < 0 || endXIndex < 0 || endYIndex < 0) return Infinity

    const startNode = startYIndex * nx + startXIndex, endNode = endYIndex * nx + endXIndex
    const total = nx * ny * 3
    const distance = new Float64Array(total), previous = new Int32Array(total), visited = new Uint8Array(total)

    distance.fill(Infinity)
    previous.fill(-1)

    const startState = startNode * 3
    distance[startState] = 0

    const turnCost = Math.max(POLYLINE_MIN_SEGMENT, clearance * POLYLINE_TURN_WEIGHT)
    let currentState = -1, currentNode = -1, currentAxis = 0
    let currentX = 0, currentY = 0, currentDistance = 0

    const relax = (nextXIndex: number, nextYIndex: number, axis: number, sign: number): void => {
        const nextX = xs[nextXIndex], nextY = ys[nextYIndex]
        const nextNode = nextYIndex * nx + nextXIndex

        if (isPolylinePointBlocked(nextX, nextY, startBounds, clearance) ||
            isPolylinePointBlocked(nextX, nextY, endBounds, clearance)) return

        if (isPolylineSegmentBlocked(currentX, currentY, nextX, nextY, startBounds, clearance) ||
            isPolylineSegmentBlocked(currentX, currentY, nextX, nextY, endBounds, clearance)) return

        if (currentState === startState) {
            if (axis === startAxis + 1) {
                if (sign !== startSign) return
            } else if (startStub <= POLYLINE_EPSILON) return
        }

        if (nextNode === endNode) {
            if (axis === endAxis + 1) {
                if (sign !== -endSign) return
            } else if (endStub <= POLYLINE_EPSILON) return
        }

        const nextState = nextNode * 3 + axis
        if (visited[nextState]) return

        const segmentLength = Math.abs(nextX - currentX) + Math.abs(nextY - currentY)
        let cost = currentDistance + segmentLength

        if (currentAxis && currentAxis !== axis) {
            cost += turnCost
            const turnCoordinate = currentAxis === POLYLINE_X + 1 ? currentX : currentY
            const preferredCoordinate = midpointAxis === POLYLINE_X ? (sx + ex) / 2 : (sy + ey) / 2
            if (Math.abs(turnCoordinate - preferredCoordinate) > POLYLINE_EPSILON) cost += turnCost * 2
        }

        if (cost < distance[nextState]) {
            distance[nextState] = cost
            previous[nextState] = currentState
        }
    }

    let bestState = -1

    for (let iteration = 0; iteration < total; iteration++) {
        let minDistance = Infinity, state = -1

        for (let i = 0; i < total; i++) {
            if (!visited[i] && distance[i] < minDistance) {
                minDistance = distance[i]
                state = i
            }
        }

        if (state < 0) break

        currentState = state
        currentNode = Math.floor(state / 3)
        currentAxis = state % 3
        currentDistance = minDistance
        visited[state] = 1

        if (currentNode === endNode) {
            bestState = state
            break
        }

        const xIndex = currentNode % nx, yIndex = Math.floor(currentNode / nx)
        currentX = xs[xIndex]
        currentY = ys[yIndex]

        if (xIndex > 0) relax(xIndex - 1, yIndex, POLYLINE_X + 1, -1)
        if (xIndex < nx - 1) relax(xIndex + 1, yIndex, POLYLINE_X + 1, 1)
        if (yIndex > 0) relax(xIndex, yIndex - 1, POLYLINE_Y + 1, -1)
        if (yIndex < ny - 1) relax(xIndex, yIndex + 1, POLYLINE_Y + 1, 1)
    }

    if (bestState < 0) return Infinity

    const reverse: number[] = []
    let state = bestState

    while (state >= 0) {
        const node = Math.floor(state / 3)
        reverse.push(xs[node % nx], ys[Math.floor(node / nx)])
        if (state === startState) break
        state = previous[state]
    }

    if (state !== startState) return Infinity

    result.length = 0
    result.push(startPoint.x, startPoint.y, sx, sy)

    for (let i = reverse.length - 4; i >= 0; i -= 2) result.push(reverse[i], reverse[i + 1])

    result.push(endPoint.x, endPoint.y)
    return distance[bestState] + startStub + endStub
}

function appendPolylinePoint(points: number[], x: number, y: number): void {
    const length = points.length
    if (length >= 2 && Math.abs(points[length - 2] - x) <= POLYLINE_EPSILON && Math.abs(points[length - 1] - y) <= POLYLINE_EPSILON) return
    points.push(x, y)
}

function appendPolylineOrthogonal(points: number[], x1: number, y1: number, x2: number, y2: number, firstAxis = POLYLINE_X): void {
    if (Math.abs(x1 - x2) > POLYLINE_EPSILON && Math.abs(y1 - y2) > POLYLINE_EPSILON) {
        if (firstAxis === POLYLINE_X) {
            const midX = (x1 + x2) / 2
            appendPolylinePoint(points, midX, y1)
            appendPolylinePoint(points, midX, y2)
        } else {
            const midY = (y1 + y2) / 2
            appendPolylinePoint(points, x1, midY)
            appendPolylinePoint(points, x2, midY)
        }
    }
    appendPolylinePoint(points, x2, y2)
}

function getPolylineEditPath(result: number[], startPoint: IPointData, endPoint: IPointData, startPort: number, endPort: number, startBounds: IBoundsData | undefined, endBounds: IBoundsData | undefined, points: number[], clearance: number): number {
    if (points.length % 2) return Infinity
    for (let i = 0; i < points.length; i++) if (!Number.isFinite(points[i])) return Infinity

    const startExit: number[] = [], endExit: number[] = []
    getPolylineExit(startPoint, startBounds, startPort, clearance, startExit)
    getPolylineExit(endPoint, endBounds, endPort, clearance, endExit)

    const sx = startExit[0], sy = startExit[1], ex = endExit[0], ey = endExit[1]

    if (isPolylineSegmentBlocked(startPoint.x, startPoint.y, sx, sy, endBounds, clearance) ||
        isPolylineSegmentBlocked(endPoint.x, endPoint.y, ex, ey, startBounds, clearance)) return Infinity

    result.length = 0
    appendPolylinePoint(result, startPoint.x, startPoint.y)
    appendPolylinePoint(result, sx, sy)

    let x = sx, y = sy

    for (let i = 0; i < points.length; i += 2) {
        const nx = points[i], ny = points[i + 1]
        appendPolylineOrthogonal(result, x, y, nx, ny, i === 0 && clearance === 0 ? startPort >> 1 : POLYLINE_X)
        x = nx
        y = ny
    }

    const endAxis = endPort >> 1

    if (Math.abs(x - ex) > POLYLINE_EPSILON && Math.abs(y - ey) > POLYLINE_EPSILON) {
        if (endAxis === POLYLINE_X) appendPolylinePoint(result, x, ey)
        else appendPolylinePoint(result, ex, y)
    }

    appendPolylinePoint(result, ex, ey)
    appendPolylinePoint(result, endPoint.x, endPoint.y)
    return getPolylineScore(result, clearance)
}

function getPolylineScore(points: number[], clearance: number): number {
    let length = 0, turns = 0, previousAxis = -1

    for (let i = 2; i < points.length; i += 2) {
        const dx = points[i] - points[i - 2], dy = points[i + 1] - points[i - 1]
        if (Math.abs(dx) <= POLYLINE_EPSILON && Math.abs(dy) <= POLYLINE_EPSILON) continue

        const axis = Math.abs(dx) > POLYLINE_EPSILON ? POLYLINE_X : POLYLINE_Y
        length += Math.abs(dx) + Math.abs(dy)
        if (previousAxis !== -1 && previousAxis !== axis) turns++
        previousAxis = axis
    }

    return length + turns * Math.max(clearance, POLYLINE_MIN_SEGMENT) * POLYLINE_TURN_WEIGHT
}

function simplifyPolyline(points: number[]): void {
    let write = 2

    for (let read = 2; read < points.length; read += 2) {
        const x = points[read], y = points[read + 1]
        const px = points[write - 2], py = points[write - 1]

        if (Math.abs(x - px) <= POLYLINE_EPSILON && Math.abs(y - py) <= POLYLINE_EPSILON) continue

        if (write >= 4) {
            const ax = points[write - 4], ay = points[write - 3]
            const horizontal = Math.abs(ay - py) <= POLYLINE_EPSILON && Math.abs(py - y) <= POLYLINE_EPSILON && (px - ax) * (x - px) >= 0
            const vertical = Math.abs(ax - px) <= POLYLINE_EPSILON && Math.abs(px - x) <= POLYLINE_EPSILON && (py - ay) * (y - py) >= 0

            if (horizontal || vertical) {
                points[write - 2] = x
                points[write - 1] = y
                continue
            }
        }

        points[write++] = x
        points[write++] = y
    }

    points.length = write
}

export function drawPolyline(path: number[], startPoint: IPointData, endPoint: IPointData, startDirection: IDirection, endDirection: IDirection, startBounds?: IBoundsData, endBounds?: IBoundsData, clearance = 8, points?: number[]): boolean {
    if (!Number.isFinite(startPoint.x) || !Number.isFinite(startPoint.y) || !Number.isFinite(endPoint.x) || !Number.isFinite(endPoint.y)) return false

    if (startBounds && (!Number.isFinite(startBounds.x) || !Number.isFinite(startBounds.y) || !Number.isFinite(startBounds.width) || !Number.isFinite(startBounds.height) || startBounds.width < 0 || startBounds.height < 0)) return false
    if (endBounds && (!Number.isFinite(endBounds.x) || !Number.isFinite(endBounds.y) || !Number.isFinite(endBounds.width) || !Number.isFinite(endBounds.height) || endBounds.width < 0 || endBounds.height < 0)) return false

    clearance = Number.isFinite(clearance) ? Math.max(0, clearance) : 8

    const startPorts: number[] = [], endPorts: number[] = []
    const startCount = getPolylinePorts(startDirection, startPoint, endPoint, startBounds, endBounds, startPorts)
    const endCount = getPolylinePorts(endDirection, endPoint, startPoint, endBounds, startBounds, endPorts)
    const candidate: number[] = [], best: number[] = []

    let bestScore = Infinity

    for (let pass = 0; pass < 2 && bestScore === Infinity; pass++) {
        const currentClearance = pass === 0 ? clearance : 0

        for (let i = 0; i < startCount; i++) {
            for (let j = 0; j < endCount; j++) {
                const score = points !== undefined
                    ? getPolylineEditPath(candidate, startPoint, endPoint, startPorts[i], endPorts[j], startBounds, endBounds, points, currentClearance)
                    : getPolylineRoute(candidate, startPoint, endPoint, startPorts[i], endPorts[j], startBounds, endBounds, currentClearance)

                if (score < bestScore) {
                    bestScore = score
                    best.length = 0
                    for (let k = 0; k < candidate.length; k++) best.push(candidate[k])
                }
            }
        }
    }

    if (!best.length) return false
    if (points === undefined) simplifyPolyline(best)

    moveTo(path, best[0], best[1])
    for (let i = 2; i < best.length; i += 2) lineTo(path, best[i], best[i + 1])
    return true
}