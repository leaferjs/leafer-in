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

function getPolylinePorts(direction: IDirection, point: IPointData, target: IPointData, bounds?: IBoundsData, targetBounds?: IBoundsData): number[] {
    const data = directionData[getPolylineDirectionIndex(direction)]
    const dx = Math.sign(data.x - 0.5), dy = Math.sign(data.y - 0.5)
    const cx = bounds ? bounds.x + bounds.width / 2 : point.x
    const cy = bounds ? bounds.y + bounds.height / 2 : point.y
    const tx = targetBounds ? targetBounds.x + targetBounds.width / 2 : target.x
    const ty = targetBounds ? targetBounds.y + targetBounds.height / 2 : target.y
    const deltaX = tx - cx, deltaY = ty - cy
    const xPort = (dx || (deltaX >= 0 ? 1 : -1)) > 0 ? 1 : 0
    const yPort = (dy || (deltaY >= 0 ? 1 : -1)) > 0 ? 3 : 2

    if (dx && !dy) return [xPort]
    if (dy && !dx) return [yPort]
    return Math.abs(deltaX) >= Math.abs(deltaY) ? [xPort, yPort] : [yPort, xPort]
}

function getPolylineExit(point: IPointData, bounds: IBoundsData | undefined, port: number, clearance: number): IPointData {
    const axis = port >> 1, sign = port & 1 ? 1 : -1

    if (axis === POLYLINE_X) {
        const x = bounds ? bounds.x + (sign > 0 ? bounds.width : 0) : point.x
        return { x: x + sign * clearance, y: point.y }
    }

    const y = bounds ? bounds.y + (sign > 0 ? bounds.height : 0) : point.y
    return { x: point.x, y: y + sign * clearance }
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

function isPolylinePortAligned(port: number, stub: number, dx: number, dy: number): boolean {
    const offset = (port >> 1) === POLYLINE_X ? dx : dy
    const sign = port & 1 ? 1 : -1
    return Math.abs(offset) <= POLYLINE_EPSILON ? stub > POLYLINE_EPSILON : offset * sign > 0
}

function isPolylineMidpointAligned(port: number | undefined, stub: number, dx: number, dy: number, axis: number): boolean {
    if (port === undefined) return true

    // 取中点路径中实际存在的第一段，忽略重合的出口和转折点
    if (axis === POLYLINE_X && Math.abs(dx / 2) > POLYLINE_EPSILON) return isPolylinePortAligned(port, stub, dx, 0)
    if (axis === POLYLINE_Y && Math.abs(dy / 2) > POLYLINE_EPSILON) return isPolylinePortAligned(port, stub, 0, dy)
    if (Math.abs(dx) <= POLYLINE_EPSILON && Math.abs(dy) <= POLYLINE_EPSILON) return true
    return isPolylinePortAligned(port, stub, dx, dy)
}

// 检查实际接入方向，允许顺向接入或垂直转向，禁止与后续线段原路折返
function isPolylineApproachAligned(points: number[], port?: number): boolean {
    if (port === undefined) return true

    const last = points.length - 2, x = points[last], y = points[last + 1]

    for (let i = last - 2; i >= 0; i -= 2) {
        const dx = points[i] - x, dy = points[i + 1] - y
        if (Math.abs(dx) > POLYLINE_EPSILON || Math.abs(dy) > POLYLINE_EPSILON) return isPolylinePortAligned(port, 1, dx, dy)
    }

    return true
}

function getPolylineRoute(result: number[], startPoint: IPointData, endPoint: IPointData, startPort: number, endPort: number | undefined, startBounds: IBoundsData | undefined, endBounds: IBoundsData | undefined, clearance: number, strictPorts: boolean, approachPort?: number): number {
    const startExit = getPolylineExit(startPoint, startBounds, startPort, clearance)
    const endExit = endPort === undefined ? endPoint : getPolylineExit(endPoint, endBounds, endPort, clearance)
    const { x: sx, y: sy } = startExit, { x: ex, y: ey } = endExit
    const startStub = Math.abs(sx - startPoint.x) + Math.abs(sy - startPoint.y)
    const endStub = Math.abs(ex - endPoint.x) + Math.abs(ey - endPoint.y)

    if (isPolylineSegmentBlocked(startPoint.x, startPoint.y, sx, sy, endBounds, clearance) ||
        isPolylineSegmentBlocked(endPoint.x, endPoint.y, ex, ey, startBounds, clearance)) return Infinity

    if (endPort === undefined && (isPolylinePointBlocked(ex, ey, startBounds, clearance) ||
        isPolylinePointBlocked(ex, ey, endBounds, clearance))) return Infinity

    const axis = endPort === undefined ? startPort >> 1 : getPolylineMidpointAxis(startPort, endPort, sx, sy, ex, ey)
    const dx = ex - sx, dy = ey - sy
    result.length = 0
    result.push(startPoint.x, startPoint.y, sx, sy)

    if ((!strictPorts || (isPolylineMidpointAligned(startPort, startStub, dx, dy, axis) &&
        isPolylineMidpointAligned(endPort, endStub, -dx, -dy, axis))) &&
        isPolylineMidpointAligned(approachPort, 1, -dx, -dy, axis)) {
        const mx = (sx + ex) / 2, my = (sy + ey) / 2
        if (axis === POLYLINE_X) result.push(mx, sy, mx, ey)
        else result.push(sx, my, ex, my)
        result.push(ex, ey, endPoint.x, endPoint.y)

        // 两端的出线段可以进入各自所属元素
        for (let i = 4; i < result.length - 2; i += 2) {
            if (isPolylineSegmentBlocked(result[i - 2], result[i - 1], result[i], result[i + 1], startBounds, clearance) ||
                isPolylineSegmentBlocked(result[i - 2], result[i - 1], result[i], result[i + 1], endBounds, clearance)) {
                result.length = 4
                break
            }
        }

        // 兼顾出口与途径点重合的情况
        if (result.length > 4 && isPolylineApproachAligned(result, approachPort)) return getPolylineScore(result, clearance)
        result.length = 4
    }

    const score = findPolylineGridRoute(result, startExit, endExit, startPort, endPort, startBounds, endBounds, clearance, axis, startStub, endStub, strictPorts, approachPort)
    if (score === Infinity) return score

    result.push(endPoint.x, endPoint.y)
    return isPolylineApproachAligned(result, approachPort) ? score + startStub + endStub : Infinity
}

function findPolylineGridRoute(result: number[], startExit: IPointData, endExit: IPointData, startPort: number, endPort: number | undefined, startBounds: IBoundsData | undefined, endBounds: IBoundsData | undefined, clearance: number, midpointAxis: number, startStub: number, endStub: number, strictPorts: boolean, approachPort?: number): number {
    const { x: sx, y: sy } = startExit, { x: ex, y: ey } = endExit
    const margin = Math.max(clearance, POLYLINE_MIN_SEGMENT) * 2
    const xs: number[] = [sx, ex, (sx + ex) / 2], ys: number[] = [sy, ey, (sy + ey) / 2]

    addPolylineBoundsCoordinates(xs, ys, startBounds, clearance, margin)
    addPolylineBoundsCoordinates(xs, ys, endBounds, clearance, margin)

    xs.push(Math.min(...xs) - margin * 2, Math.max(...xs) + margin * 2)
    ys.push(Math.min(...ys) - margin * 2, Math.max(...ys) + margin * 2)

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
    const pending = [startState]

    const turnCost = Math.max(POLYLINE_MIN_SEGMENT, clearance * POLYLINE_TURN_WEIGHT)
    const preferredCoordinate = midpointAxis === POLYLINE_X ? (sx + ex) / 2 : (sy + ey) / 2
    let currentState = -1, currentNode = -1, currentAxis = 0
    let currentX = 0, currentY = 0, currentDistance = 0

    const relax = (nextXIndex: number, nextYIndex: number, axis: number): void => {
        const nextX = xs[nextXIndex], nextY = ys[nextYIndex]
        const nextNode = nextYIndex * nx + nextXIndex
        const dx = nextX - currentX, dy = nextY - currentY

        if (nextNode === startNode) return

        // 接入约束独立于端口约束，放宽端口时仍禁止在途径点处折返
        if (approachPort !== undefined && nextNode === endNode && !isPolylinePortAligned(approachPort, 1, -dx, -dy)) return

        if (strictPorts && ((currentState === startState && !isPolylinePortAligned(startPort, startStub, dx, dy)) ||
            (endPort !== undefined && nextNode === endNode && !isPolylinePortAligned(endPort, endStub, -dx, -dy)))) return

        if (isPolylinePointBlocked(nextX, nextY, startBounds, clearance) ||
            isPolylinePointBlocked(nextX, nextY, endBounds, clearance) ||
            isPolylineSegmentBlocked(currentX, currentY, nextX, nextY, startBounds, clearance) ||
            isPolylineSegmentBlocked(currentX, currentY, nextX, nextY, endBounds, clearance)) return

        const nextState = nextNode * 3 + axis
        if (visited[nextState]) return

        let cost = currentDistance + (Math.abs(dx) + Math.abs(dy))

        if (currentAxis && currentAxis !== axis) {
            cost += turnCost
            const turnCoordinate = currentAxis === POLYLINE_X + 1 ? currentX : currentY
            if (Math.abs(turnCoordinate - preferredCoordinate) > POLYLINE_EPSILON) cost += turnCost * 2
        }

        if (cost < distance[nextState]) {
            if (distance[nextState] === Infinity) pending.push(nextState)
            distance[nextState] = cost
            previous[nextState] = currentState
        }
    }

    let bestState = -1

    while (pending.length) {
        let index = 0, state = pending[0]
        for (let i = 1; i < pending.length; i++) {
            const next = pending[i]
            if (distance[next] < distance[state] || (distance[next] === distance[state] && next < state)) {
                index = i
                state = next
            }
        }

        pending[index] = pending[pending.length - 1]
        pending.pop()
        currentState = state
        currentNode = Math.floor(state / 3)
        currentAxis = state % 3
        currentDistance = distance[state]
        visited[state] = 1

        if (currentNode === endNode) {
            bestState = state
            break
        }

        const xIndex = currentNode % nx, yIndex = Math.floor(currentNode / nx)
        currentX = xs[xIndex]
        currentY = ys[yIndex]

        if (xIndex > 0) relax(xIndex - 1, yIndex, POLYLINE_X + 1)
        if (xIndex < nx - 1) relax(xIndex + 1, yIndex, POLYLINE_X + 1)
        if (yIndex > 0) relax(xIndex, yIndex - 1, POLYLINE_Y + 1)
        if (yIndex < ny - 1) relax(xIndex, yIndex + 1, POLYLINE_Y + 1)
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

    for (let i = reverse.length - 4; i >= 0; i -= 2) result.push(reverse[i], reverse[i + 1])
    return distance[bestState]
}

// 锚点或途径点被元素覆盖时，保留一条尽量少穿过元素的临时接线
function getPolylineFallback(start: IPointData, end: IPointData, port: number, startBounds?: IBoundsData, endBounds?: IBoundsData): number[] {
    const { x: sx, y: sy } = start, { x: ex, y: ey } = end
    if (sx === ex || sy === ey) return [sx, sy, ex, ey]

    const horizontal = (port >> 1) === POLYLINE_X
    const crosses = (x: number, y: number): number => {
        let count = 0
        if (isPolylineSegmentBlocked(sx, sy, x, y, startBounds, 0)) count++
        if (isPolylineSegmentBlocked(x, y, ex, ey, startBounds, 0)) count++
        if (isPolylineSegmentBlocked(sx, sy, x, y, endBounds, 0)) count++
        if (isPolylineSegmentBlocked(x, y, ex, ey, endBounds, 0)) count++
        return count
    }
    const xy = crosses(ex, sy), yx = crosses(sx, ey)
    return xy < yx || (xy === yx && horizontal) ? [sx, sy, ex, sy, ex, ey] : [sx, sy, sx, ey, ex, ey]
}

function getBestPolyline(startPoint: IPointData, endPoint: IPointData, startDirection: IDirection, endDirection: IDirection | undefined, startBounds: IBoundsData | undefined, endBounds: IBoundsData | undefined, clearance: number, approachPort?: number): number[] {
    const startPorts = getPolylinePorts(startDirection, startPoint, endPoint, startBounds, endDirection === undefined ? undefined : endBounds)
    const endPorts = endDirection === undefined ? [undefined] : getPolylinePorts(endDirection, endPoint, startPoint, endBounds, startBounds)
    let candidate: number[] = [], best: number[] = [], bestScore = Infinity

    // 先保留方向并减小间距，再允许贴边转向
    for (let pass = clearance ? 0 : 1; pass < 3 && !best.length; pass++) {
        const gap = pass ? 0 : clearance
        for (let i = 0; i < startPorts.length; i++) {
            for (let j = 0; j < endPorts.length; j++) {
                const score = getPolylineRoute(candidate, startPoint, endPoint, startPorts[i], endPorts[j], startBounds, endBounds, gap, pass < 2, approachPort)
                if (score < bestScore) {
                    bestScore = score
                    const previous = best
                    best = candidate
                    candidate = previous
                }
            }
        }
    }

    if (!best.length) return getPolylineFallback(startPoint, endPoint, startPorts[0], startBounds, endBounds)
    simplifyPolyline(best)
    const last = best.length - 2
    if (best[last] !== endPoint.x || best[last + 1] !== endPoint.y) best.push(endPoint.x, endPoint.y)
    return best
}

function getPolylineEditSide(point: IPointData, waypoint: IPointData, direction: IDirection, bounds: IBoundsData | undefined, otherBounds: IBoundsData | undefined, clearance: number, points: number[], index: number, step: number): number[] {
    if (point.x === waypoint.x && point.y === waypoint.y) return []

    let approachPort: number | undefined

    // 跳过重合途径点，根据后续线段确定接入方向
    for (let i = index + step; i >= 0 && i < points.length; i += step) {
        const dx = points[i] - waypoint.x, dy = points[i + 1] - waypoint.y
        if (Math.abs(dx) <= POLYLINE_EPSILON && Math.abs(dy) <= POLYLINE_EPSILON) continue

        if (Math.abs(dy) <= POLYLINE_EPSILON) approachPort = dx > 0 ? 0 : 1
        else if (Math.abs(dx) <= POLYLINE_EPSILON) approachPort = dy > 0 ? 2 : 3
        break
    }

    const side = getBestPolyline(point, waypoint, direction, undefined, bounds, otherBounds, clearance, approachPort)
    side.length -= 2
    return side
}

function drawPolylineEditPath(path: number[], startPoint: IPointData, endPoint: IPointData, startDirection: IDirection, endDirection: IDirection, startBounds: IBoundsData | undefined, endBounds: IBoundsData | undefined, clearance: number, points: number[]): boolean {
    const length = points.length, last = length - 2
    if (length % 2) return false
    for (let i = 0; i < length; i++) if (!Number.isFinite(points[i])) return false

    const start = getPolylineEditSide(startPoint, { x: points[0], y: points[1] }, startDirection, startBounds, endBounds, clearance, points, 0, 2)
    const end = getPolylineEditSide(endPoint, { x: points[last], y: points[last + 1] }, endDirection, endBounds, startBounds, clearance, points, last, -2)

    // 只拼接两端生成的接线，中间顶点按原坐标写入
    const first = start.length ? start : points
    moveTo(path, first[0], first[1])
    for (let i = 2; i < start.length; i += 2) lineTo(path, start[i], start[i + 1])
    for (let i = start.length ? 0 : 2; i < length; i += 2) lineTo(path, points[i], points[i + 1])
    for (let i = end.length - 2; i >= 0; i -= 2) lineTo(path, end[i], end[i + 1])
    return true
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
    if (points?.length) return drawPolylineEditPath(path, startPoint, endPoint, startDirection, endDirection, startBounds, endBounds, clearance, points)

    const best = getBestPolyline(startPoint, endPoint, startDirection, endDirection, startBounds, endBounds, clearance)
    moveTo(path, best[0], best[1])
    for (let i = 2; i < best.length; i += 2) lineTo(path, best[i], best[i + 1])
    return true
}