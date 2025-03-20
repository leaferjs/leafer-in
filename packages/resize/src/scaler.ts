import { IBranch, ILeaf, ILine, IPolygon, IText, IPointData } from '@leafer-ui/interface'
import { Direction9, MatrixHelper } from '@leafer-ui/draw'

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

    if (direction !== undefined) {

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

    const data = leaf.__
    if (!data.__autoWidth) leaf.width *= fontScale
    if (!data.__autoHeight) leaf.height *= fontScale

}

export function scaleResizePath(leaf: ILeaf, scaleX: number, scaleY: number): void {
    PathScaler.scale(leaf.__.path, scaleX, scaleY)
    leaf.path = leaf.__.path
}

export function scaleResizePoints(leaf: ILine | IPolygon, scaleX: number, scaleY: number): void {
    const { points } = leaf
    typeof points[0] === 'object' ? (points as IPointData[]).forEach(p => { p.x *= scaleX, p.y *= scaleY }) : PathScaler.scalePoints(points as number[], scaleX, scaleY)
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