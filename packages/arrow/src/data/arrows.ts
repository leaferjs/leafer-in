import { IArrowStyle, IArrowTypeData, IPathDataArrow, IPathDataArrowMap, IUI, IPointData, IArrowPathData } from '@leafer-ui/interface'
import { DataHelper, PointHelper, isObject } from '@leafer-ui/draw'

import { PathMatrixHelper } from '../PathMatrixHelper'


const { layout, rotate } = PathMatrixHelper
const { getAngle } = PointHelper
const zero = { x: 0 }, half = { x: -0.5 }

const angle: IPathDataArrow = { connect: zero, offset: { x: -0.71, bevelJoin: 0.36, roundJoin: 0.22 }, path: [1, -3, -3, 2, 0, 0, 2, -3, 3] } // moveTo(-3, -3).lineTo(0, 0).lineTo(-3, 3)
const angleSide: IPathDataArrow = { connect: half, offset: { x: -1.207, bevelJoin: 0.854, roundJoin: 0.707 }, path: [1, -3, -3, 2, 0, 0, 2, -1, 0] } // moveTo(-3, -3).lineTo(0, 0).lineTo(-1, 0)

const triangleLinePath = [1, -3, 0, 2, -3, -2, 2, 0, 0, 2, -3, 2, 2, -3, 0]  // moveTo(-3, 0).lineTo(-3, -2).lineTo(0, 0).lineTo(-3, 2).lineTo(-3, 0)
const triangleFill: IPathDataArrow = { connect: zero, offset: { x: -0.9, bevelJoin: 0.624, roundJoin: 0.4 }, path: [...triangleLinePath] }
const triangle: IPathDataArrow = DataHelper.clone(triangleFill) as IPathDataArrow
triangle.path = [...triangleLinePath, 1, -2.05, 1.1, 2, -2.05, -1.1] // fill: moveTo(-2.05, 1.1).lineTo(-2.05, -1.1)
triangle.dashPath = [1, -2, 0, 2, -0.5, 0]

const triangleFlipFill: IPathDataArrow = { connect: zero, offset: half, path: [...triangleFill.path] } // triangle rotate 180
const triangleFlip: IPathDataArrow = { connect: zero, offset: half, path: [...triangle.path], dashPath: [1, -2.5, 0, 2, -1, 0] } // triangle rotate 180
rotate(triangleFlipFill.path, 180, { x: -1.5, y: 0 })
rotate(triangleFlip.path, 180, { x: -1.5, y: 0 })

const arrowLinePath = [1, -3, 0, 2, -3.5, -1.8, 2, 0, 0, 2, -3.5, 1.8, 2, -3, 0]  // moveTo(-3, 0).lineTo(-3.5, -1.8).lineTo(0, 0).lineTo(-3.5, 1.8).lineTo(-3, 0)
const arrowFill: IPathDataArrow = { connect: zero, offset: { x: -1.1, bevelJoin: 0.872, roundJoin: 0.6 }, path: [...arrowLinePath] }
const arrow: IPathDataArrow = DataHelper.clone(arrowFill) as IPathDataArrow
arrow.path = [...arrowLinePath, 1, -2.25, 0.95, 2, -2.25, -0.95] // fill: moveTo(-2.25, 0.95).lineTo(-2.25, -0.95) 
arrow.dashPath = [1, -3, 0, 2, -0.5, 0]

const circleLine: IPathDataArrow = { connect: { x: -1.8 }, path: [1, 1.8, -0.1, 2, 1.8, 0, 26, 0, 0, 1.8, 0, 359, 0], }  //drawArc(0, 0, 2, 0, 360)
const circleFill: IPathDataArrow = { connect: { x: 0.5 }, path: [...circleLine.path] }
const circle: IPathDataArrow = DataHelper.clone(circleFill) as IPathDataArrow
circle.path = [...circleLine.path, 1, 0, 0, 26, 0, 0, 1, 0, 360, 0] // fill: moveTo(0,0).arc(0, 0, 1, 0, 360)
circle.dashPath = [1, -0.5, 0, 2, 0.5, 0]

const squareLine: IPathDataArrow = { connect: { x: -1.4 }, path: [1, -1.4, 0, 2, -1.4, -1.4, 2, 1.4, -1.4, 2, 1.4, 1.4, 2, -1.4, 1.4, 2, -1.4, 0] } // moveTo(-1.4, 0).lineTo(-1.4, -1.4).lineTo(1.4, -1.4).lineTo(1.4, 1.4).lineTo(-1.4, 1.4).lineTo(-1.4, 0)
const squareFill: IPathDataArrow = { path: [...squareLine.path] }
const square: IPathDataArrow = { path: [...squareLine.path, 2, -1.4, -0.49, 2, 1, -0.49, 1, -1.4, 0.49, 2, 1, 0.49] } // fill: moveTo(-1.4, -0.49).lineTo(1, -0.49).moveTo(-1.4, 0.49).lineTo(1, 0.49)

const diamondLine = DataHelper.clone(squareLine) as IPathDataArrow // square-line rotate 45
diamondLine.connect.x = -1.9
const diamondFill: IPathDataArrow = DataHelper.clone(squareFill) as IPathDataArrow // squareFill rotate 45
const diamond: IPathDataArrow = DataHelper.clone(square) as IPathDataArrow // square rotate 45
rotate(diamondLine.path, 45)
rotate(diamondFill.path, 45)
rotate(diamond.path, 45)

const mark: IPathDataArrow = { offset: half, path: [1, 0, -2, 2, 0, 2] } // moveTo(0, -2).lineTo(0, 2)

export const arrows: IPathDataArrowMap = {
    angle,
    'angle-side': angleSide,

    arrow,
    triangle,
    'triangle-flip': triangleFlip,

    circle,
    'circle-line': circleLine,

    square,
    'square-line': squareLine,

    diamond,
    'diamond-line': diamondLine,

    mark,
}

export const fillArrows: IPathDataArrowMap = {
    triangle: triangleFill,
    'triangle-flip': triangleFlipFill,
    arrow: arrowFill,
    circle: circleFill,
    square: squareFill,
    diamond: diamondFill
}

export function getArrowPath(ui: IUI, arrow: IArrowStyle, from: IPointData, to: IPointData, size: number, connectOffset: IPointData, hasDashPattern?: boolean): IArrowPathData {
    let pathData: IPathDataArrow, scale = 1, rotation = 0, fill: boolean

    const { strokeCap, strokeJoin } = ui.__

    if (isObject(arrow)) {
        if ((arrow as IArrowTypeData).type) {
            scale = (arrow as IArrowTypeData).scale || 1
            rotation = (arrow as IArrowTypeData).rotation || 0
            pathData = arrows[(arrow as IArrowTypeData).type]
            if (scale > 1) { // 放大后，优先使用fill路径数据
                const fillData = fillArrows[(arrow as IArrowTypeData).type]
                if (fillData) pathData = fillData, fill = true
            }
        } else pathData = arrow as IPathDataArrow
    } else {
        pathData = arrows[arrow]
    }

    if (!fill) fill = pathData.fill

    const { offset, connect, path, dashPath } = pathData

    let connectX = connect ? connect.x * scale : 0
    let offsetX = offset ? offset.x : 0

    const data = [...path]
    if (hasDashPattern && dashPath) data.push(...dashPath)

    if (strokeCap !== 'none') connectX -= 0.5
    if (offset) {
        if (strokeJoin === 'round' && offset.roundJoin) offsetX += offset.roundJoin
        else if (strokeJoin === 'bevel' && offset.bevelJoin) offsetX += offset.bevelJoin
    }

    if (scale !== 1) layout(data, 0, 0, scale, scale) // 缩放箭头比例

    if (offsetX) layout(data, offsetX, 0)

    layout(data, to.x, to.y, size, size, getAngle(from, to) + rotation) // scale rotate 先围绕 data 数据应用后，再加 to

    connectOffset.x = (connectX + offsetX) * size

    const arrowData: IArrowPathData = { data }
    if (fill) arrowData.fill = fill
    return arrowData
}