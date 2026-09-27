import { IPointData, IPathCommandData } from '@leafer-ui/interface'

import { PathCommandMap, PointHelper } from '@leafer-ui/core'

const { toNumberPoints } = PointHelper
const { M, L, C, Z } = PathCommandMap


/**
 * 使用角平分线自动生成平滑 Bezier 曲线
 *
 * 算法特点：
 *
 * 1. Handle 方向：
 *    使用前后方向的角平分线
 *
 * 2. Handle 长度：
 *    左右分别根据相邻边长度计算
 *
 *    in  = AB * curve
 *    out = BC * curve
 *
 * 3. 自动曲率控制：
 *
 *    - 接近平角：
 *      降低 handle，避免直线中间产生鼓包
 *
 *    - 接近尖角：
 *      降低 handle，避免曲线过冲
 *
 * 4. 性能：
 *
 *    - O(n)
 *    - 无对象创建
 *    - 无临时数组
 *    - 适合大规模路径
 *
 *
 * curve:
 *
 * 0    直线
 * 0.5  推荐
 * 1    最大平滑
 */

/**
 * 使用角平分线法线生成自动 Bezier 曲线
 *
 * 算法：
 *
 * 1. 通过 BA / BC 求角平分方向
 * 2. 旋转 90° 得到曲线切线方向
 * 3. 左右 handle 长度分别根据两侧距离计算
 *
 * handle:
 *
 *        C2
 *        |
 *        |
 * A ---- B ---- C
 *        |
 *        |
 *        C1
 *
 *
 * curve:
 *
 * 0     直线
 * 0.5   推荐
 * 1     最大曲率
 */
export function drawPoints(data: IPathCommandData, originPoints: number[] | IPointData[], curve?: boolean | number, close?: boolean): void {
    const points = toNumberPoints(originPoints)
    const count = points.length >> 1

    if (count < 2) return

    data.push(M, points[0], points[1])

    if (!curve || count < 3) {

        for (let i = 1; i < count; i++) {

            data.push(L, points[i * 2], points[i * 2 + 1])
        }

        if (close) data.push(Z)
        return
    }

    let tension = curve === true ? 0.5 : curve as number

    if (tension < 0) tension = 0
    else if (tension > 1) tension = 1

    const end = close ? count : count - 1

    let lastOutX = points[0]
    let lastOutY = points[1]

    /**
     * 非闭合路径第一个点：
     * 使用第一条边方向作为初始切线
     */
    {

        const dx = points[2] - points[0]
        const dy = points[3] - points[1]

        const len = Math.sqrt(dx * dx + dy * dy)

        if (len) {
            lastOutX = points[0] + dx / len * len * tension
            lastOutY = points[1] + dy / len * len * tension
        }
    }


    for (let i = 0; i < end; i++) {
        const index = i + 1 === count ? 0 : i + 1

        const bx = points[index * 2]
        const by = points[index * 2 + 1]

        const prev = index === 0 ? count - 1 : index - 1
        const next = index + 1 === count ? 0 : index + 1

        const ax = points[prev * 2]
        const ay = points[prev * 2 + 1]

        const cx = points[next * 2]
        const cy = points[next * 2 + 1]

        /**
         * BA
         */
        let bax = ax - bx
        let bay = ay - by

        /**
         * BC
         */
        let bcx = cx - bx
        let bcy = cy - by

        const ab = Math.sqrt(bax * bax + bay * bay)
        const bc = Math.sqrt(bcx * bcx + bcy * bcy)

        let inX = bx
        let inY = by

        let outX = bx
        let outY = by

        if (ab || bc) {

            /**
             * 计算角平分方向
             */
            let ux = 0
            let uy = 0

            if (ab) {
                ux += bax / ab
                uy += bay / ab
            }

            if (bc) {
                ux += bcx / bc
                uy += bcy / bc
            }

            /**
             * 角平分线长度
             */
            let uLen = Math.sqrt(ux * ux + uy * uy)

            /**
             * 180度：
             * 两个方向抵消
             *
             * 使用 BC 方向
             */
            if (!uLen) {

                if (bc) {
                    ux = bcx / bc
                    uy = bcy / bc

                } else {
                    ux = bax / ab
                    uy = bay / ab
                }


                uLen = 1
            }

            ux /= uLen
            uy /= uLen

            /**
             * 角平分线旋转90度
             *
             * 得到曲线切线方向
             */
            let tx = -uy
            let ty = ux

            /**
             * 保证方向朝向下一点
             */
            if (bc) {
                if (tx * bcx + ty * bcy < 0) {
                    tx = -tx
                    ty = -ty
                }
            }

            /**
             * 计算夹角
             */
            let cos = 0

            if (ab && bc) {
                cos = (bax * bcx + bay * bcy) / (ab * bc)
                if (cos > 1) cos = 1
                else if (cos < -1) cos = -1
            }

            /**
             * 曲率限制：
             *
             * 平角降低
             * 尖角降低
             */
            let angleFactor = Math.sqrt(Math.sqrt(Math.max(0, 1 - cos * cos)))

            /**
             * 保留少量曲率，
             * 避免完全退化
             */
            if (angleFactor < 0.15) angleFactor = 0.15

            let inLength = ab * tension * angleFactor
            let outLength = bc * tension * angleFactor

            /**
             * 防止 handle 过长
             */
            const maxLength = Math.min(ab || bc, bc || ab) * 0.5

            if (inLength > maxLength) inLength = maxLength
            if (outLength > maxLength) outLength = maxLength

            inX = bx - tx * inLength
            inY = by - ty * inLength

            outX = bx + tx * outLength
            outY = by + ty * outLength
        }

        data.push(C,

            // 上一个节点 handle out
            lastOutX,
            lastOutY,

            // 当前节点 handle in
            inX,
            inY,

            // 当前节点
            bx,
            by
        )

        lastOutX = outX
        lastOutY = outY
    }

    if (close) data.push(Z)
}