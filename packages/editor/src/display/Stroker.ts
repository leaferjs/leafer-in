import { IUI, ILeaferCanvas, IRenderOptions, IRectInputData } from '@leafer-ui/interface'
import { Paint, UI, MatrixHelper } from '@leafer-ui/core'

import { IStroker } from '@leafer-in/interface'

import { targetAttr } from '../decorator/data'


const matrix = MatrixHelper.get()
const { abs } = Math
const { copy, scale } = MatrixHelper

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
        const { stroke, strokeWidth } = style
        this.set({ stroke, strokeWidth })
        this.target = target
    }

    public __draw(canvas: ILeaferCanvas, options: IRenderOptions): void {
        const { list } = this
        if (list.length) {

            let leaf: IUI
            const { stroke, strokeWidth } = this.__
            const { bounds } = options

            for (let i = 0; i < list.length; i++) {
                leaf = list[i]
                if (bounds && bounds.hit(leaf.__world, options.matrix)) {

                    let drewPath: boolean

                    if (leaf.__.editSize === 'scale') {
                        const aScaleX = abs(leaf.__world.scaleX), aScaleY = abs(leaf.__world.scaleY)
                        if (aScaleX !== aScaleY) { // need no scale stroke
                            copy(matrix, leaf.__world)
                            scale(matrix, 1 / aScaleX, 1 / aScaleY)

                            canvas.setWorld(matrix, options.matrix)
                            canvas.beginPath()
                            this.__.strokeWidth = strokeWidth

                            const { x, y, width, height } = leaf.__layout.boxBounds
                            canvas.rect(x * aScaleX, y * aScaleY, width * aScaleX, height * aScaleY)

                            drewPath = true
                        }
                    }

                    if (!drewPath) {
                        canvas.setWorld(leaf.__world, options.matrix)
                        canvas.beginPath()
                        leaf.__.__pathForRender ? leaf.__drawRenderPath(canvas) : leaf.__drawPathByBox(canvas)
                        this.__.strokeWidth = strokeWidth / abs(leaf.__world.scaleX)
                    }

                    typeof stroke === 'string' ? Paint.stroke(stroke, this, canvas) : Paint.strokes(stroke, this, canvas)
                }
            }

            this.__.strokeWidth = strokeWidth
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
    stroker.forceUpdate()
}
