import { IBranch, ILeaf, ILine, IPolygon, IText } from '@leafer-ui/interface'
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

export function scaleResizeFontSize(leaf: IText, scaleX: number, scaleY: number): void {
    const { app } = leaf
    const editor = app && app.editor

    if (editor.editing) {

        let { width, height } = leaf.__localBoxBounds
        width *= (scaleY - scaleX) * (leaf.scaleX < 0 ? -1 : 1)
        height *= (scaleX - scaleY) * (leaf.scaleY < 0 ? -1 : 1)

        switch (editor.resizeDirection) {
            case top:
            case bottom:
                leaf.fontSize *= scaleY
                leaf.x -= width / 2
                break
            case left:
            case right:
                leaf.fontSize *= scaleX
                leaf.y -= height / 2
                break
            case topLeft:
            case topRight:
                leaf.fontSize *= scaleX
                leaf.y -= height
                break
            default: // bottomLeft / bottomRight / other
                leaf.fontSize *= scaleX
        }

    } else {

        leaf.fontSize *= scaleX

    }
}

export function scaleResizePath(leaf: ILeaf, scaleX: number, scaleY: number): void {
    PathScaler.scale(leaf.__.path, scaleX, scaleY)
    leaf.path = leaf.__.path
}

export function scaleResizePoints(leaf: ILine | IPolygon, scaleX: number, scaleY: number): void {
    PathScaler.scalePoints(leaf.__.points, scaleX, scaleY)
    leaf.points = leaf.__.points
}


export function scaleResizeGroup(group: IBranch, scaleX: number, scaleY: number): void {
    const { children } = group
    for (let i = 0; i < children.length; i++) {
        matrix.a = scaleX // must update
        matrix.d = scaleY
        children[i].transform(matrix, true)
    }
}