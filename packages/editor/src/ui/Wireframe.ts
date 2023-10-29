import { IBounds, IUI, ILeaferCanvas, IRenderOptions } from '@leafer-ui/interface'
import { Bounds, Paint, UI } from '@leafer-ui/core'

import { IWireframe } from '@leafer-in/interface'


export class Wireframe extends UI implements IWireframe {

    public get target(): IUI | IUI[] { return this._target }
    public set target(value: IUI | IUI[]) {
        this._target = value, this.list = value ? (value instanceof Array ? value : [value]) : []
        this.forceUpdate()
    }
    private _target: IUI | IUI[]

    public list: IUI[] = []

    public bounds: IBounds = new Bounds()

    constructor() {
        super()
        this.hittable = false
        this.strokeAlign = 'center'
        this.noBounds = true
        this.width = this.height = 10000
    }

    public __draw(canvas: ILeaferCanvas, options: IRenderOptions): void {
        if (this.list.length) {
            const { strokeWidth, stroke } = this.__
            this.list.forEach(target => {
                canvas.setWorld(target.__world, options.matrix)
                target.__drawRenderPath(canvas)
                this.__.strokeWidth = strokeWidth / target.__world.scaleX
                typeof stroke === 'string' ? Paint.stroke(stroke, this, canvas, options) : Paint.strokes(stroke, this, canvas, options)
            })
            this.__.strokeWidth = strokeWidth
        }
    }
}