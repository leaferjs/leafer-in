import { IMatrixData, IPathCommandData, IMotionPathData, IRotationPointData, IPointData, IUnitData } from '@leafer-ui/interface'
import { BezierHelper, MatrixHelper, PathCommandMap, PointHelper, UnitConvert } from '@leafer-ui/draw'

import { HighBezierHelper } from './HighBezierHelper'


const { M, L, C, Z } = PathCommandMap
const tempPoint = {} as IPointData, tempFrom = {} as IPointData

export const HighCurveHelper = {

    transform(data: IPathCommandData, matrix: IMatrixData): void {
        let i: number = 0, command: number

        const len = data.length
        while (i < len) {
            command = data[i]
            switch (command) {
                case M: //moveto(x, y)
                case L: //lineto(x, y)
                    HighCurveHelper.transformPoints(data, matrix, i, 1)
                    i += 3
                    break
                case C: //bezierCurveTo(x1, y1, x2, y2, x,y)
                    HighCurveHelper.transformPoints(data, matrix, i, 3)
                    i += 7
                    break
                case Z: //closepath()
                    i += 1
            }
        }
    },

    transformPoints(data: IPathCommandData, matrix: IMatrixData, start: number, pointCount: number): void {
        for (let i = start + 1, end = i + pointCount * 2; i < end; i += 2) {
            tempPoint.x = data[i]
            tempPoint.y = data[i + 1]
            MatrixHelper.toOuterPoint(matrix, tempPoint)
            data[i] = tempPoint.x
            data[i + 1] = tempPoint.y
        }
    },

    getMotionPathData(data: IPathCommandData): IMotionPathData {
        let total = 0, distance: number, segments: number[] = []
        let i = 0, x = 0, y = 0, toX: number, toY: number, command: number

        const len = data.length
        while (i < len) {
            command = data[i]
            switch (command) {
                case M: //moveto(x, y)
                case L: //lineto(x, y)
                    toX = data[i + 1]
                    toY = data[i + 2]
                    distance = (command === L && i > 0) ? PointHelper.getDistanceFrom(x, y, toX, toY) : 0
                    x = toX
                    y = toY
                    i += 3
                    break
                case C: //bezierCurveTo(x1, y1, x2, y2, x,y)
                    toX = data[i + 5]
                    toY = data[i + 6]
                    distance = HighBezierHelper.getDistance(x, y, data[i + 1], data[i + 2], data[i + 3], data[i + 4], toX, toY)
                    x = toX
                    y = toY
                    i += 7
                    break
                case Z: //closepath()
                    i += 1
                default:
                    distance = 0

            }

            segments.push(distance)
            total += distance
        }

        return { total, segments, data }

    },


    getDistancePoint(distanceData: IMotionPathData, motionDistance: number | IUnitData, motionPrecision?: number): IRotationPointData {
        const { segments, data } = distanceData
        motionDistance = UnitConvert.number(motionDistance, distanceData.total)

        let total = 0, distance: number, to = {} as IRotationPointData
        let i = 0, index = 0, x: number = 0, y: number = 0, toX: number, toY: number, command: number
        let x1: number, y1: number, x2: number, y2: number, t: number

        const len = data.length
        while (i < len) {
            command = data[i]
            switch (command) {
                case M: //moveto(x, y)
                case L: //lineto(x, y)
                    toX = data[i + 1]
                    toY = data[i + 2]
                    distance = segments[index]

                    if (total + distance >= motionDistance || !distanceData.total) {
                        if (!i) x = toX, y = toY // first M
                        tempFrom.x = x
                        tempFrom.y = y
                        to.x = toX
                        to.y = toY
                        PointHelper.getDistancePoint(tempFrom, to, motionDistance - total, true)
                        to.rotation = PointHelper.getAngle(tempFrom, to)
                        return to
                    }

                    x = toX
                    y = toY
                    i += 3
                    break
                case C: //bezierCurveTo(x1, y1, x2, y2, x,y)
                    toX = data[i + 5]
                    toY = data[i + 6]
                    distance = segments[index]

                    if (total + distance >= motionDistance) {
                        x1 = data[i + 1], y1 = data[i + 2], x2 = data[i + 3], y2 = data[i + 4]
                        t = HighBezierHelper.getT(motionDistance - total, distance, x, y, x1, y1, x2, y2, toX, toY, motionPrecision)
                        BezierHelper.getPointAndSet(t, x, y, x1, y1, x2, y2, toX, toY, to)
                        to.rotation = HighBezierHelper.getRotation(t, x, y, x1, y1, x2, y2, toX, toY)
                        return to
                    }

                    x = toX
                    y = toY
                    i += 7
                    break
                case Z: //closepath()
                    i += 1
                default:
                    distance = 0
            }

            index++
            total += distance
        }

        return to
    },

    getDistancePath(distanceData: IMotionPathData, motionDistance: number | IUnitData, motionPrecision?: number): IPathCommandData {
        const { segments, data } = distanceData, path: IPathCommandData = []
        motionDistance = UnitConvert.number(motionDistance, distanceData.total)

        let total = 0, distance: number, to = {} as IRotationPointData
        let i = 0, index = 0, x: number = 0, y: number = 0, toX: number, toY: number, command: number
        let x1: number, y1: number, x2: number, y2: number, t: number

        const len = data.length
        while (i < len) {
            command = data[i]
            switch (command) {
                case M: //moveto(x, y)
                case L: //lineto(x, y)
                    toX = data[i + 1]
                    toY = data[i + 2]
                    distance = segments[index]

                    if (total + distance >= motionDistance || !distanceData.total) {
                        if (!i) x = toX, y = toY // first M
                        tempFrom.x = x
                        tempFrom.y = y
                        to.x = toX
                        to.y = toY
                        PointHelper.getDistancePoint(tempFrom, to, motionDistance - total, true)
                        path.push(command, to.x, to.y)
                        return path
                    }

                    x = toX
                    y = toY
                    i += 3
                    path.push(command, x, y)
                    break
                case C: //bezierCurveTo(x1, y1, x2, y2, x,y)
                    x1 = data[i + 1], y1 = data[i + 2], x2 = data[i + 3], y2 = data[i + 4]
                    toX = data[i + 5]
                    toY = data[i + 6]
                    distance = segments[index]

                    if (total + distance >= motionDistance) {
                        t = HighBezierHelper.getT(motionDistance - total, distance, x, y, x1, y1, x2, y2, toX, toY, motionPrecision)
                        HighBezierHelper.cut(path, t, x, y, x1, y1, x2, y2, toX, toY)
                        return path
                    }

                    x = toX
                    y = toY
                    i += 7
                    path.push(command, x1, y1, x2, y2, toX, toY)
                    break
                case Z: //closepath()
                    i += 1
                    path.push(command)
                default:
                    distance = 0

            }

            index++
            total += distance
        }

        return path
    }

}