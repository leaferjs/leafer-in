import { IBox, ILeaferCanvas, IRenderOptions } from '@leafer-ui/interface'
import { UI } from '@leafer-ui/draw'

import { IEditor } from '@leafer-in/interface'

const bigBounds = { x: 0, y: 0, width: 100000, height: 100000 }

export class EditMask extends UI {

    public editor: IEditor

    constructor(editor: IEditor) {
        super()
        this.editor = editor
        this.hittable = false
        this.visible = 0
    }

    override __updateWorldBounds(): void {
        Object.assign(this.__local, bigBounds) // 强制修改渲染包围盒
        Object.assign(this.__world, bigBounds)
    }

    public __draw(canvas: ILeaferCanvas, options: IRenderOptions): void {

        const { editor } = this, { mask } = editor.mergedConfig
        if (mask && editor.editing) {
            canvas.fillWorld(canvas.bounds, mask === true ? 'rgba(0,0,0,0.8)' : mask)
            if (options.bounds && !options.bounds.hit(editor.editBox.rect.__world, options.matrix)) return

            canvas.saveBlendMode('destination-out')
            options = { ...options, shape: true }
            editor.list.forEach(item => {
                item.__render(canvas, options)
                const { parent } = item
                if (parent && (parent as IBox).textBox) parent.__renderShape(canvas, options) // 文本框
            })
            canvas.restoreBlendMode()
        }
    }

    public destroy(): void {
        this.editor = null
        super.destroy()
    }

}
