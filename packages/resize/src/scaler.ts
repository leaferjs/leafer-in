import { IBranch, ILeaf, ILine, IPolygon, IText, IPointData } from '@leafer-ui/interface'
import { Direction9, MatrixHelper, isArray, isObject, isUndefined, isTrackChanges, DataHelper } from '@leafer-ui/draw'

import { PathScaler } from './PathScaler'


const matrix = MatrixHelper.get()
const { topLeft, top, topRight, right, bottom, left } = Direction9

export function scaleResize(leaf: ILeaf, scaleX: number, scaleY: number): void {
    if (leaf.pathInputed) {
        scaleResizePath(leaf, scaleX, scaleY)
    } else {
        // fix: Text / Box auto width / height, need check scale === 1
        if (scaleX !== 1) leaf.width *= scaleX
        if (scaleY !== 1) leaf.height *= scaleY
    }
}

export function scaleResizeFontSize(leaf: IText, scaleX: number, scaleY: number, direction?: Direction9): void {
    let fontScale = scaleX

    if (!isUndefined(direction)) {

        const layout = leaf.__layout

        let { width, height } = layout.boxBounds
        width *= scaleY - scaleX
        height *= scaleX - scaleY

        switch (direction) { // 编辑器控制点的位置
            case top:
            case bottom:
                fontScale = scaleY
                layout.affectScaleOrRotation ? leaf.moveInner(-width / 2, 0) : leaf.x -= width / 2
                break
            case left:
            case right:
                layout.affectScaleOrRotation ? leaf.moveInner(0, -height / 2) : leaf.y -= height / 2
                break
            case topLeft:
            case topRight:
                layout.affectScaleOrRotation ? leaf.moveInner(0, -height) : leaf.y -= height
                break
        }

    }

    leaf.fontSize *= fontScale

    const data = leaf.__, { padding, lineHeight, letterSpacing } = data
    if (padding) leaf.padding = isArray(padding) ? padding.map(item => item * fontScale) : padding * fontScale
    if (!data.__autoWidth) leaf.width *= fontScale
    if (!data.__autoHeight) leaf.height *= fontScale

    if (isObject(lineHeight)) {
        if (lineHeight.type === 'px') data.lineHeight = { type: 'px', value: lineHeight.value * fontScale }
    } else if (lineHeight) data.lineHeight = lineHeight * fontScale

    if (isObject(letterSpacing)) {
        if (letterSpacing.type === 'px') data.letterSpacing = { type: 'px', value: letterSpacing.value * fontScale }
    } else if (letterSpacing) data.letterSpacing = letterSpacing * fontScale

}

export function scaleResizePath(leaf: ILeaf, scaleX: number, scaleY: number): void {
    let { path } = leaf.__
    if (!isTrackChanges(leaf.leafer)) path = [...path] // 避免产生引用，导致污染历史数据
    PathScaler.scale(path, scaleX, scaleY)
    leaf.path = path
}

export function scaleResizePoints(leaf: ILine | IPolygon, scaleX: number, scaleY: number): void {
    let { points } = leaf
    const isOb = isObject(points[0])
    if (!isTrackChanges(leaf.leafer)) points = isOb ? DataHelper.clone(points) as IPointData[] : [...points] as number[] // 避免产生引用，导致污染历史数据
    isOb ? (points as IPointData[]).forEach(p => { p.x *= scaleX, p.y *= scaleY }) : PathScaler.scalePoints(points as number[], scaleX, scaleY)
    leaf.points = points
}


export function scaleResizeGroup(group: IBranch, scaleX: number, scaleY: number): void {
    const { children } = group
    for (let i = 0; i < children.length; i++) {
        matrix.a = scaleX // must update
        matrix.d = scaleY
        children[i].transform(matrix, true)
    }
}