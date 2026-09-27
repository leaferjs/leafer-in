import { IPathCommandData, IPathCommandDataWithWindingRule } from '@leafer/interface'
import { PathCommandDataHelper } from "@leafer/core"
import { IStrokeAlign } from '@leafer-ui/interface'

/**
 * 矩形描边路径生成器
 * 支持非均匀描边（上右下左宽度不同）与圆角逻辑
 */
export function createRectStrokePath(width: number, height: number, cornerRadius: number[] | undefined, strokeWidth: number[], strokeAlign: IStrokeAlign): IPathCommandDataWithWindingRule {

    if (cornerRadius) {
        const [r0, r1, r2, r3] = cornerRadius
        const [t, r_w, b, l] = strokeWidth

        const hasRadius = (r0 + r1 + r2 + r3) > 0

        // 场景 A: 包含圆角，必须使用 evenodd 挖空法
        if (hasRadius) {
            const data: IPathCommandData = []
            const expand = strokeAlign === 'inside' ? 0 : (strokeAlign === 'center' ? 0.5 : 1)
            const shrink = 1 - expand

            // 外边界参数
            const ox = -l * expand, oy = -t * expand
            const ow = width + (l + r_w) * expand
            const oh = height + (t + b) * expand
            const outerR = [
                r0 + Math.max(t, l) * expand,
                r1 + Math.max(t, r_w) * expand,
                r2 + Math.max(b, r_w) * expand,
                r3 + Math.max(b, l) * expand
            ]

            // 内边界参数
            const ix = l * shrink, iy = t * shrink
            const iw = width - (l + r_w) * shrink
            const ih = height - (t + b) * shrink

            // 绘制外框
            PathCommandDataHelper.roundRect(data, ox, oy, ow, oh, outerR)

            // 只有内框有空间时才绘制内框（进行掏空）
            if (iw > 0 && ih > 0) {
                const innerR = [
                    Math.max(0, r0 - Math.max(t, l) * shrink),
                    Math.max(0, r1 - Math.max(t, r_w) * shrink),
                    Math.max(0, r2 - Math.max(b, r_w) * shrink),
                    Math.max(0, r3 - Math.max(b, l) * shrink)
                ]
                PathCommandDataHelper.roundRect(data, ix, iy, iw, ih, innerR)
            }

            return { data, windingRule: 'evenodd' }
        }
    }



    // 场景 B: 纯直角，采用四边拼接法 (性能最优，无 WindingRule 依赖)
    return createRectStrokePathNoRadius(width, height, strokeWidth, strokeAlign)
}

/**
 * 纯直角矩形描边生成器 (拼接法)
 */
function createRectStrokePathNoRadius(
    width: number,
    height: number,
    strokeWidth: number[],
    strokeAlign: IStrokeAlign
): IPathCommandDataWithWindingRule {
    const data: IPathCommandData = []
    const [t, r_w, b, l] = strokeWidth

    const ext = strokeAlign === 'inside' ? 0 : (strokeAlign === 'center' ? 0.5 : 1)
    const ins = 1 - ext

    // 计算外部极值边界坐标
    const xL = -l * ext
    const xR = width + r_w * ext
    const yT = -t * ext
    const yB = height + b * ext

    // 计算内部裁剪边界坐标 (用于侧边填充高度)
    const innerYStart = t * ins
    const innerYEnd = height - b * ins
    const innerHeight = Math.max(0, innerYEnd - innerYStart)

    // 1. Top Bar: 覆盖全宽
    if (t > 0) PathCommandDataHelper.rect(data, xL, yT, xR - xL, t)

    // 2. Bottom Bar: 覆盖全宽
    if (b > 0) PathCommandDataHelper.rect(data, xL, yB - b, xR - xL, b)

    // 3. Left Bar: 填充中间高度，避免与 Top/Bottom 重合
    if (l > 0 && innerHeight > 0) {
        PathCommandDataHelper.rect(data, xL, innerYStart, l, innerHeight)
    }

    // 4. Right Bar: 填充中间高度
    if (r_w > 0 && innerHeight > 0) {
        PathCommandDataHelper.rect(data, xR - r_w, innerYStart, r_w, innerHeight)
    }

    return { data }
}