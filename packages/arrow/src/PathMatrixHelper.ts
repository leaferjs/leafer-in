import { IPathCommandData, IPointData } from '@leafer-ui/interface'
import { PathCommandMap as Command, PointHelper } from '@leafer-ui/draw'


const { M, L, C, Q, O } = Command
const { rotate, copyFrom, scale } = PointHelper
const point: IPointData = {} as IPointData

export const PathMatrixHelper = {

    layout(data: IPathCommandData, x: number, y: number, scaleX?: number, scaleY?: number, rotation?: number, origin?: IPointData): void {
        let command: number, i = 0, j: number, len = data.length

        while (i < len) {
            command = data[i]
            switch (command) {
                case M:  // moveto(x, y)
                case L:  // lineto(x, y)
                    setPoint(data, i + 1, x, y, scaleX, scaleY, rotation, origin)
                    i += 3
                    break
                case C:  // bezierCurveTo(x1, y1, x2, y2, x, y)
                    for (j = 1; j < 6; j += 2) setPoint(data, i + j, x, y, scaleX, scaleY, rotation, origin)
                    i += 7
                    break
                case Q:  // quadraticCurveTo(x1, y1, x, y)
                    for (j = 1; j < 4; j += 2) setPoint(data, i + j, x, y, scaleX, scaleY, rotation, origin)
                    i += 5
                    break
                case O: // arc(x, y, radius, startAngle, endAngle, anticlockwise)
                    data[i + 1] += x
                    data[i + 2] += y
                    if (scaleX) data[i + 3] *= scaleX
                    if (rotation) {
                        data[i + 4] += rotation
                        data[i + 5] += rotation
                    }
                    i += 7
                    break
            }
        }
    },

    rotate(data: IPathCommandData, rotation?: number, center?: IPointData): void {
        PathMatrixHelper.layout(data, 0, 0, 1, 1, rotation, center)
    }

}


function setPoint(data: IPathCommandData, startIndex: number, x: number, y: number, scaleX?: number, scaleY?: number, rotation?: number, origin?: IPointData): void {
    copyFrom(point, data[startIndex], data[startIndex + 1])
    if (rotation) rotate(point, rotation, origin)
    if (scaleX) scale(point, scaleX, scaleY)
    data[startIndex] = x + point.x
    data[startIndex + 1] = y + point.y
}