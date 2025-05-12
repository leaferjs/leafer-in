export { Arrow } from './Arrow'
export { ArrowData } from './data/ArrowData'
export { PathArrowModule } from './PathArrowModule'
export { PathMatrixHelper } from './PathMatrixHelper'
export { arrowType } from './decorator'

import { IUI, ILeaferCanvas } from '@leafer-ui/interface'
import { PathArrow, UI, Plugin, Paint } from '@leafer-ui/draw'
import { PathArrowModule } from './PathArrowModule'
import { arrowType } from './decorator'


Plugin.add('arrow')


// addAttr
UI.addAttr('startArrow', 'none', arrowType)
UI.addAttr('endArrow', 'none', arrowType)


Object.assign(PathArrow, PathArrowModule)
Object.assign(Paint, {
    strokeArrow(_stroke: string, ui: IUI, canvas: ILeaferCanvas): void {
        if (ui.__.dashPattern) {  // fix: dashPattern Arrow
            canvas.beginPath()
            ui.__drawPathByData(canvas, ui.__.__pathForArrow)
            canvas.dashPattern = null
            canvas.stroke()
        }
    }
})