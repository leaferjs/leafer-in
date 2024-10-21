import { IPathCommandData } from '@leafer-ui/interface'
import { PathCommandMap } from '@leafer-ui/draw'


// 高斯-勒让德积分节点和权重
const gaussNodes = [0.1488743389, 0.4333953941, 0.6794095682, 0.8650633666, 0.9739065285]
const gaussWeights = [0.2955242247, 0.2692667193, 0.2190863625, 0.1494513491, 0.0666713443]

const { sqrt } = Math

export const HighBezierHelper = {

    getDistance(fromX: number, fromY: number, x1: number, y1: number, x2: number, y2: number, toX: number, toY: number): number {
        let distance = 0, t1: number, t2: number, d1X: number, d1Y: number, d2X: number, d2Y: number
        for (let i = 0; i < gaussNodes.length; i++) {
            t1 = 0.5 * (1 + gaussNodes[i])
            t2 = 0.5 * (1 - gaussNodes[i])

            d1X = getDerivative(t1, fromX, x1, x2, toX)
            d1Y = getDerivative(t1, fromY, y1, y2, toY)

            d2X = getDerivative(t2, fromX, x1, x2, toX)
            d2Y = getDerivative(t2, fromY, y1, y2, toY)

            distance += gaussWeights[i] * (sqrt(d1X * d1X + d1Y * d1Y) + sqrt(d2X * d2X + d2Y * d2Y))
        }
        return distance * 0.5
    },

    getDerivative(t: number, fromV: number, v1: number, v2: number, toV: number): number { // 导数
        const o = 1 - t
        return 3 * o * o * (v1 - fromV) + 6 * o * t * (v2 - v1) + 3 * t * t * (toV - v2)
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

const { getDerivative } = HighBezierHelper