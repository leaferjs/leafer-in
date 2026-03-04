export { Arrow } from './Arrow'
export { ArrowData } from './data/ArrowData'
export { PathArrowModule } from './PathArrowModule'
export { PathMatrixHelper } from './PathMatrixHelper'
export { arrowType } from './decorator'

import { IUI, ILeaferCanvas, IRenderOptions } from '@leafer-ui/interface'
import { PathArrow, UI, Plugin, Paint } from '@leafer-ui/draw'
import { PathArrowModule } from './PathArrowModule'
import { arrowType } from './decorator'


Plugin.add('arrow')


// addAttr
UI.addAttr('startArrow', 'none', arrowType)
UI.addAttr('endArrow', 'none', arrowType)


Object.assign(PathArrow, PathArrowModule)
Object.assign(Paint, {
    strokeArrow(stroke: string, ui: IUI, canvas: ILeaferCanvas, _renderOptions: IRenderOptions): void {
        const { __startArrowPath, __endArrowPath, dashPattern } = ui.__
        if (dashPattern) canvas.dashPattern = null // fix: dashPattern Arrow

        if (__startArrowPath) {
            canvas.beginPath()
            ui.__drawPathByData(canvas, __startArrowPath.data)
            canvas.stroke()
            if (__startArrowPath.fill) {
                canvas.fillStyle = stroke
                canvas.fill()
            }
        }

        if (__endArrowPath) {
            canvas.beginPath()
            ui.__drawPathByData(canvas, __endArrowPath.data)
            canvas.stroke()
            if (__endArrowPath.fill) {
                canvas.fillStyle = stroke
                canvas.fill()
            }
        }
    }
})