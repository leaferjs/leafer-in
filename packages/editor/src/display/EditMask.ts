import { ILeaferCanvas, IRenderOptions } from '@leafer-ui/interface'
import { UI } from '@leafer-ui/draw'

import { IEditor } from '@leafer-in/interface'


export class EditMask extends UI {

    public editor: IEditor

    constructor(editor: IEditor) {
        super()
        this.editor = editor
        this.hittable = false
    }

    public __draw(canvas: ILeaferCanvas, options: IRenderOptions): void {
        const { editor } = this
        const { mask } = editor.mergeConfig

        if (mask && editor.list.length) {
            const { rect } = editor.editBox
            const { width, height } = rect.__

            canvas.resetTransform()
            canvas.fillWorld(canvas.bounds, mask === true ? 'rgba(0,0,0,0.8)' : mask)
            canvas.setWorld(rect.__world, options.matrix)
            canvas.clearRect(0, 0, width, height)
        }
    }

    public destroy(): void {
        this.editor = null
        super.destroy()
    }

}
