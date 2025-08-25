export { Arrow } from './Arrow'
export { ArrowData } from './data/ArrowData'
export { PathArrowModule } from './PathArrowModule'
export { PathMatrixHelper } from './PathMatrixHelper'
export { arrowType } from './decorator'

import { IUI, ILeaferCanvas, IUIData, ILineData } from '@leafer-ui/interface'
import { PathArrow, UI, UIData, LineData, Plugin, Paint, defineKey } from '@leafer-ui/draw'
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

defineKey(UIData.prototype, '__clonePathForArrow', {
    get() { return (this as IUIData).__pathInputed || (this as IUIData).cornerRadius }
})

defineKey(LineData.prototype, '__clonePathForArrow', {
    get() { return super.__clonePathForArrow || (this as ILineData).points }
})