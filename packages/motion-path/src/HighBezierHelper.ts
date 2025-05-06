import { IPathCommandData } from '@leafer-ui/interface'
import { BezierHelper, OneRadian, PathCommandMap } from '@leafer-ui/draw'


// 高斯-勒让德积分节点和权重
const gaussNodes = [0.1488743389, 0.4333953941, 0.6794095682, 0.8650633666, 0.9739065285]
const gaussWeights = [0.2955242247, 0.2692667193, 0.2190863625, 0.1494513491, 0.0666713443]

const { sqrt } = Math
const { getDerivative } = BezierHelper

export const HighBezierHelper = {

    getDistance(fromX: number, fromY: number, x1: number, y1: number, x2: number, y2: number, toX: number, toY: number, t = 1): number {
        let distance = 0, t1: number, t2: number, d1X: number, d1Y: number, d2X: number, d2Y: number, half = t / 2
        for (let i = 0; i < gaussNodes.length; i++) {
            t1 = half * (1 + gaussNodes[i])
            t2 = half * (1 - gaussNodes[i])

            d1X = getDerivative(t1, fromX, x1, x2, toX)
            d1Y = getDerivative(t1, fromY, y1, y2, toY)

            d2X = getDerivative(t2, fromX, x1, x2, toX)
            d2Y = getDerivative(t2, fromY, y1, y2, toY)

            distance += gaussWeights[i] * (sqrt(d1X * d1X + d1Y * d1Y) + sqrt(d2X * d2X + d2Y * d2Y))
        }
        return distance * half
    },

    getRotation(t: number, fromX: number, fromY: number, x1: number, y1: number, x2: number, y2: number, toX: number, toY: number): number { // 切线角度
        const dx = getDerivative(t, fromX, x1, x2, toX)
        const dy = getDerivative(t, fromY, y1, y2, toY)
        return Math.atan2(dy, dx) / OneRadian
    },

    getT(distance: number, totalDistance: number, fromX: number, fromY: number, x1: number, y1: number, x2: number, y2: number, toX: number, toY: number, precision = 1): number { // 弧长反解 t
        let low = 0, high = 1, middle = distance / totalDistance, realPrecision = precision / totalDistance / 3

        if (middle >= 1) return 1
        if (middle <= 0) return 0

        while (high - low > realPrecision) {   // 2分法快速对比
            getDistance(fromX, fromY, x1, y1, x2, y2, toX, toY, middle) < distance ? low = middle : high = middle
            middle = (low + high) / 2
        }

        return middle
    },

    cut(data: IPathCommandData, t: number, fromX: number, fromY: number, x1: number, y1: number, x2: number, y2: number, toX: number, toY: number) {
        const o = 1 - t
        const ax = o * fromX + t * x1, ay = o * fromY + t * y1
        const mbx = o * x1 + t * x2, mby = o * y1 + t * y2
        const mcx = o * x2 + t * toX, mcy = o * y2 + t * toY

        const bx = o * ax + t * mbx, by = o * ay + t * mby
        const mbcx = o * mbx + t * mcx, mbcy = o * mby + t * mcy

        const cx = o * bx + t * mbcx, cy = o * by + t * mbcy
        data.push(PathCommandMap.C, ax, ay, bx, by, cx, cy)
    }

}

const { getDistance } = HighBezierHelper