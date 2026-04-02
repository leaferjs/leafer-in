import { BezierHelper } from '@leafer-ui/draw'


// 获取圆角切线距离
export function getTangentDistance(r: number, x: number, y: number, lastX: number, lastY: number, nextX: number, nextY: number): number {
    // 1. 构造入射向量 U (P -> lastP) 和出射向量 V (P -> nextP)
    const ux = lastX - x, uy = lastY - y
    const vx = nextX - x, vy = nextY - y

    // 2. 计算向量长度（平方和开方）
    const lenU = Math.sqrt(ux * ux + uy * uy)
    const lenV = Math.sqrt(vx * vx + vy * vy)

    // 3. 边界防御：若线段长度几乎为0，则不产生圆角
    if (lenU < 0.001 || lenV < 0.001) return 0

    // 4. 计算向量夹角余弦值 cos(θ) = (U·V) / (|U|*|V|)
    const cosTheta = (ux * vx + uy * vy) / (lenU * lenV)

    // 5. 精度钳位：防止浮点误差导致 cos 越界 [-1, 1]，避开分母为0的情况
    const safeCos = Math.max(-0.99999, Math.min(0.99999, cosTheta))

    // 6. 核心几何推导：d = r * sqrt((1 - cosθ) / (1 + cosθ))
    let d = r * Math.sqrt((1 - safeCos) / (1 + safeCos))

    // 7. 【关键性能与安全约束】：最大距离不得超过相邻边长的一半
    // 这样可以确保相邻顶点的圆角不会发生几何重叠或路径自交。
    const maxD = Math.min(lenU / 2, lenV / 2)
    return Math.min(d, maxD)
}

// 精准定位贝塞尔曲线参数 t
export function getCorrectT(d: number, x: number, y: number, x1: number, y1: number, x2: number, y2: number, toX: number, toY: number): number {
    if (d <= 0) return 0

    // 1. 预估总弦长（起点到终点的直线距离）
    const chordLen = Math.sqrt((toX - x) ** 2 + (toY - y) ** 2)

    // 2. 边界保护：若要求的距离超过弦长，为了路径安全，强制限制在曲线 50% 处
    if (d >= chordLen) return 0.5

    // 3. 初始猜测值估算：利用 t=0 处的瞬时速度矢量 v(0) = 3*(P1 - P0)
    const vx0 = 3 * (x1 - x)
    const vy0 = 3 * (y1 - y)
    let v0mag = Math.sqrt(vx0 * vx0 + vy0 * vy0)

    // 【优化点】：若起点与控制点重合（初速度为0），降级使用弦长线性比例，防止 NaN
    if (v0mag < 1e-6) v0mag = chordLen || 1

    let t = Math.min(0.5, d / v0mag)
    const tempP = { x: 0, y: 0 }

    // 4. 牛顿迭代 (Newton-Raphson) 循环
    for (let i = 0; i < 5; i++) {
        // 获取当前参数 t 对应的坐标点
        BezierHelper.getPointAndSet(t, x, y, x1, y1, x2, y2, toX, toY, tempP)

        const dx = tempP.x - x
        const dy = tempP.y - y
        const currentDist = Math.sqrt(dx * dx + dy * dy)

        // 数值稳定性检查：若当前点过于靠近起点，尝试向外探测
        if (currentDist < 1e-6) {
            t = t * 1.5
            continue
        }

        // 计算当前 t 处的导数向量 (x', y')
        const vxt = BezierHelper.getDerivative(t, x, x1, x2, toX)
        const vyt = BezierHelper.getDerivative(t, y, y1, y2, toY)

        // 计算目标函数的导数 f'(t) = (dx*x' + dy*y') / currentDist
        const f_prime = (dx * vxt + dy * vyt) / currentDist

        // 如果导数过小，说明进入平台期或计算异常，停止迭代
        if (Math.abs(f_prime) < 1e-6) break

        // 牛顿法公式：t_next = t - f(t) / f'(t)
        const deltaT = (currentDist - d) / f_prime
        const nextT = t - deltaT

        // 【收敛域保护】：强制限制在 [0, 0.6] 范围内寻找最优解，防止迭代跳出贝塞尔曲线有效区间
        const safeNextT = Math.max(0, Math.min(0.6, nextT))

        // 精度满足 1e-5 (像素级精度) 提前退出
        if (Math.abs(safeNextT - t) < 1e-5) {
            t = safeNextT
            break
        }
        t = safeNextT
    }

    // 最终返回结果，上限截断在 0.5 处，确保圆弧不会占据整条曲线导致形状崩坏
    return Math.max(0, Math.min(0.5, t))
}