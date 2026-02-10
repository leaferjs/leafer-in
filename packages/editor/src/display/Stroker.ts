import { IUI, ILeaferCanvas, IRenderOptions, IUIInputData, IMatrixWithOptionHalfData } from '@leafer-ui/interface'
import { Paint, UI, MatrixHelper, getBoundsData, getMatrixData, BoundsHelper, LeafBoundsHelper, isArray, isString, surfaceType, ColorConvert } from '@leafer-ui/draw'

import { IStroker } from '@leafer-in/interface'

import { targetAttr } from '../decorator/data'


const { abs } = Math
const { copy } = MatrixHelper
const { setListWithFn } = BoundsHelper
const { worldBounds } = LeafBoundsHelper
const matrix = getMatrixData() as IMatrixWithOptionHalfData
const bounds = getBoundsData()

export class Stroker extends UI implements IStroker {

    @targetAttr(onTarget)
    public target: IUI | IUI[]

    public list: IUI[] = []

    @surfaceType('render-path')
    public strokePathType: 'path' | 'render-path'

    constructor() {
        super()
        this.visible = 0
        this.hittable = false
        this.strokeAlign = 'center'
    }

    public setTarget(target: IUI | IUI[], style?: IUIInputData): void {
        if (style) this.set(style)
        this.target = target
        this.update()
    }

    public update(style?: IUIInputData): void {
        const { list } = this
        if (list.length) {
            setListWithFn(bounds, list, worldBounds)
            if (style) this.set(style)
            this.set(bounds)
            this.visible = true
        } else this.visible = 0
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

                    copy(matrix, worldTransform)
                    matrix.half = strokeWidth % 2

                    canvas.setWorld(matrix, options.matrix)
                    canvas.beginPath()


                    if (this.strokePathType === 'path') {
                        leaf.__drawPath(canvas)
                    } else {
                        if (leaf.__.__useArrow) leaf.__drawPath(canvas)
                        else leaf.__.__pathForRender ? leaf.__drawRenderPath(canvas) : leaf.__drawPathByBox(canvas)
                    }

                    data.strokeWidth = strokeWidth / Math.max(aScaleX, aScaleY)

                    if (data.shadow) {
                        const shadow = data.shadow[0], { scaleX, scaleY } = this.getRenderScaleData(true, shadow.scaleFixed)
                        canvas.save(), canvas.setWorldShadow(shadow.x * scaleX, shadow.y * scaleY, shadow.blur * scaleX, ColorConvert.string(shadow.color))
                    }

                    if (stroke) isString(stroke) ? Paint.stroke(stroke, this, canvas, options) : Paint.strokes(stroke, this, canvas, options)
                    if (fill) isString(fill) ? Paint.fill(fill, this, canvas, options) : Paint.fills(fill, this, canvas, options)

                    if (data.shadow) canvas.restore()

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
    stroker.list = value ? (isArray(value) ? value : [value]) : []
}
