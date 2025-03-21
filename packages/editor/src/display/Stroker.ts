import { IUI, ILeaferCanvas, IRenderOptions, IRectInputData } from '@leafer-ui/interface'
import { Paint, UI, MatrixHelper, getBoundsData, getMatrixData, BoundsHelper, LeafBoundsHelper } from '@leafer-ui/draw'

import { IStroker } from '@leafer-in/interface'

import { targetAttr } from '../decorator/data'


const { abs } = Math
const { copy, scale } = MatrixHelper
const { setListWithFn } = BoundsHelper
const { worldBounds } = LeafBoundsHelper
const matrix = getMatrixData()
const bounds = getBoundsData()

export class Stroker extends UI implements IStroker {

    @targetAttr(onTarget)
    public target: IUI | IUI[]

    public list: IUI[] = []

    constructor() {
        super()
        this.hittable = false
        this.strokeAlign = 'center'
    }

    public setTarget(target: IUI | IUI[], style: IRectInputData): void {
        this.set(style)
        this.target = target
        this.update()
    }

    public update(): void {
        const { list } = this
        if (list.length) {
            setListWithFn(bounds, list, worldBounds)
            this.set(bounds)
        } else {
            this.width = this.height = 1
        }
    }

    public __draw(canvas: ILeaferCanvas, options: IRenderOptions): void {
        const { list } = this

        if (list.length) {

            let leaf: IUI
            const data = this.__, { stroke, strokeWidth, fill } = data, { bounds } = options

            for (let i = 0; i < list.length; i++) {
                leaf = list[i]
                const { worldTransform, worldRenderBounds } = leaf

                if (worldRenderBounds.width && worldRenderBounds.height && (!bounds || bounds.hit(worldRenderBounds, options.matrix))) {

                    const aScaleX = abs(worldTransform.scaleX), aScaleY = abs(worldTransform.scaleY)

                    if (aScaleX !== aScaleY) { // need no scale stroke, use rect path

                        copy(matrix, worldTransform)
                        scale(matrix, 1 / aScaleX, 1 / aScaleY)

                        canvas.setWorld(matrix, options.matrix)
                        canvas.beginPath()
                        data.strokeWidth = strokeWidth

                        const { x, y, width, height } = leaf.__layout.boxBounds
                        canvas.rect(x * aScaleX, y * aScaleY, width * aScaleX, height * aScaleY)

                    } else {

                        canvas.setWorld(worldTransform, options.matrix)
                        canvas.beginPath()

                        if (leaf.__.__useArrow) leaf.__drawPath(canvas)
                        else leaf.__.__pathForRender ? leaf.__drawRenderPath(canvas) : leaf.__drawPathByBox(canvas)

                        data.strokeWidth = strokeWidth / abs(worldTransform.scaleX)

                    }

                    if (stroke) typeof stroke === 'string' ? Paint.stroke(stroke, this, canvas) : Paint.strokes(stroke, this, canvas)
                    if (fill) typeof fill === 'string' ? Paint.fill(fill, this, canvas) : Paint.fills(fill, this, canvas)
                }
            }

            data.strokeWidth = strokeWidth
        }
    }

    public destroy(): void {
        this.target = null
        super.destroy()
    }

}

function onTarget(stroker: Stroker): void {
    const value = stroker.target
    stroker.list = value ? (value instanceof Array ? value : [value]) : []
}
