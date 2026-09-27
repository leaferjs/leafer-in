import { IBoundsData, IDirection, IDirection4, ILinker, IPointData, IUI } from '@leafer-ui/interface'
import { AroundHelper, BoundsHelper, Direction9, PointHelper } from '@leafer-ui/draw'


const { directionData } = AroundHelper

const directionNames: IDirection[] = [
    'top-left',
    'top',
    'top-right',
    'right',
    'bottom-right',
    'bottom',
    'bottom-left',
    'left',
    'center'
]

export const LinkerHelper = {

    /**
     * 根据箭头方向获取控制点
     */
    getCtrlPoint(linker: ILinker, node: IUI, point: IPointData, direction: IDirection, ctrl: IPointData, offsetAngle?: number): IPointData {

        if (node) {
            point = node.getBoxPoint(point, linker)
            // half 需要 / startNode.scale
        }

        let ctrlPoint
        switch (direction) {
            case 'left':
            case 'top-left':
            case 'bottom-left':
                ctrlPoint = {
                    x: point.x - ctrl.x,
                    y: point.y
                }
                break
            case 'top':
                ctrlPoint = {
                    x: point.x,
                    y: point.y - ctrl.y
                }
                break
            case 'right':
            case 'top-right':
            case 'bottom-right':
                ctrlPoint = {
                    x: point.x + ctrl.x,
                    y: point.y
                }
                break
            case 'bottom':
                ctrlPoint = {
                    x: point.x,
                    y: point.y + ctrl.y
                }
                break
            default:
                ctrlPoint = {
                    x: point.x,
                    y: point.y
                }
        }
        if (offsetAngle) { // 旋转角度
            offsetAngle = offsetAngle / 180 * Math.PI
            ctrlPoint = {
                x: (ctrlPoint.x - point.x) * Math.cos(offsetAngle) - (ctrlPoint.y - point.y) * Math.sin(offsetAngle) + point.x,
                y: (ctrlPoint.x - point.x) * Math.sin(offsetAngle) + (ctrlPoint.y - point.y) * Math.cos(offsetAngle) + point.y
            }
        }

        if (node) node.getWorldPointByBox(ctrlPoint, linker, undefined, true)

        return ctrlPoint
    },

    // 是否为相反方向
    isOppositeDirection(from: IDirection, to: IDirection): boolean {
        switch (from) {
            case 'left':
                return to == 'right'
            case 'top':
                return to == 'bottom'
            case 'right':
                return to == 'left'
            case 'bottom':
                return to == 'top'
            case 'center':
                return to == 'center'
            default:
                return false
        }
    },

    /**
       * 获取to 相对于 from 的方向
       * @param from
       * @param to
       * @returns
       */
    getDirectionForFromPoint(from: IPointData, to: IPointData): IDirection4 {
        const a = from.x - to.x
        const b = from.y - to.y

        let direction: IDirection
        let angle = (180 * Math.atan2(b, a)) / Math.PI

        if (angle < 0) angle = 360 + angle

        if (angle > 315 || angle < 45) {
            direction = 'left'
        } else if (angle > 45 && angle < 135) {
            direction = 'top'
        } else if (angle > 135 && angle < 225) {
            direction = 'right'
        } else {
            direction = 'bottom'
        }

        return direction
    },

    getRotateDirection(direction: IDirection, rotation: number, totalDirection = 8): IDirection {
        let directionIndex = Direction9[direction]
        directionIndex = (directionIndex + Math.round(rotation / (360 / totalDirection))) % totalDirection
        if (directionIndex < 0) directionIndex += totalDirection
        return directionNames[directionIndex]
    },

    getDirection,

    getPointDirection,

    autoRotatePoint(point: IPointData, origin: IPointData, ui: IUI): void {
        const { rotation, scaleX, scaleY } = ui
        const oneFlip = scaleX * scaleY < 0
        if (rotation || oneFlip) PointHelper.rotate(point, oneFlip ? -rotation : rotation, origin)
    }

}



function getPointDirection(boxPoint: IPointData, bounds: IBoundsData, eight?: boolean): IDirection {
    const { width, height } = bounds
    const hitRadiusX = width / 4
    const hitRadiusY = height / 4

    for (let i = 0; i < directionData.length; i++) {
        const unit = directionData[i]
        // 百分比坐标转像素
        const px = unit.x * width
        const py = unit.y * height

        const dx = boxPoint.x - px
        const dy = boxPoint.y - py

        if (Math.abs(dx) <= hitRadiusX && Math.abs(dy) <= hitRadiusY) {
            if (eight) {
                if (directionNames[i] !== 'center') return directionNames[i]
            } else return directionNames[i]
        }
    }

    return undefined
}


function getDirection(boxPoint: IPointData, bounds: IBoundsData, four?: boolean): IDirection4 | 'center' {
    const { width, height } = bounds
    const center = BoundsHelper.getPoint(bounds, 'center', true)
    // 将元素沿着对角线切成4块，匹配对应上下左右四个方向
    // 转为以中心为原点的坐标
    const dx = boxPoint.x - center.x
    const dy = boxPoint.y - center.y

    if (!four) {
        // 中心点
        if (Math.abs(dx) < width / 4 && Math.abs(dy) < height / 4) return 'center'
    }

    // ----------------------------------------
    // 将矩形按比例缩放到正方形空间
    //
    // 等价于比较：
    // |dx| / width  和  |dy| / height
    //
    // 但为了避免除法，改为：
    // |dx| * height  和  |dy| * width
    //
    // 这样可以严格按矩形的两条对角线划分区域
    // ----------------------------------------

    const ax = Math.abs(dx) * height
    const ay = Math.abs(dy) * width

    // 左右区域
    if (ax > ay) {
        return dx > 0 ? 'right' : 'left'
    }

    // 上下区域
    return dy > 0 ? 'bottom' : 'top'
}