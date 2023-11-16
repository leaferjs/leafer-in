import { IBounds, IUI, ILeaferCanvas, IRenderOptions, IRectInputData } from '@leafer-ui/interface'
import { Bounds, Paint, UI } from '@leafer-ui/core'

import { IWireframe } from '@leafer-in/interface'

import { targetAttr } from '../decorator/data'


export class Wireframe extends UI implements IWireframe {

    @targetAttr(onTarget)
    public target: IUI | IUI[]

    public list: IUI[] = []

    public bounds: IBounds = new Bounds()

    constructor() {
        super()
        this.hittable = false
        this.strokeAlign = 'center'
        this.noBounds = true
        this.width = this.height = 10000
    }

    public setTarget(target: IUI | IUI[], style: IRectInputData): void {
        const { stroke, strokeWidth } = style
        this.set({ stroke, strokeWidth })
        this.target = target
    }

    public __draw(canvas: ILeaferCanvas, options: IRenderOptions): void {
        if (this.list.length) {
            const { strokeWidth, stroke } = this.__
            this.list.forEach(target => {
                canvas.setWorld(target.__world, options.matrix)
                canvas.beginPath()
                target.__.__pathForRender ? target.__drawRenderPath(canvas) : target.__drawPathByBox(canvas)
                const { scaleX, scaleY } = target.__world
                this.__.strokeWidth = strokeWidth / Math.abs(Math.max(scaleX, scaleY))
                typeof stroke === 'string' ? Paint.stroke(stroke, this, canvas, options) : Paint.strokes(stroke, this, canvas, options)
            })
            this.__.strokeWidth = strokeWidth
        }
    }

    public destroy(): void {
        this.target = null
        super.destroy()
    }

}

function onTarget(wireFrame: Wireframe): void {
    const value = wireFrame.target
    wireFrame.list = value ? (value instanceof Array ? value : [value]) : []
    wireFrame.forceUpdate()
}
