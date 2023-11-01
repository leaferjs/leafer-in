import { IPointData } from '@leafer-ui/interface'
import { IEditor, IEditorResizeEvent, IEditorRotateEvent, IEditorTool, IEditorSkewEvent, IEditorMoveEvent } from '@leafer-in/interface'

export const RectTool: IEditorTool = {

    name: 'RectTool',

    getMirrorData(editor: IEditor): IPointData {
        const { scaleX, scaleY } = editor.box
        return {
            x: scaleX < 0 ? 1 : 0, // 1 = mirrorX
            y: scaleY < 0 ? 1 : 0
        }
    },

    move(e: IEditorMoveEvent): void {
        e.target.move(e.moveX, e.moveY)
    },

    resize(e: IEditorResizeEvent): void {
        const { target, resize, targetOrigin, scaleX, scaleY } = e
        target.scaleOf(targetOrigin, scaleX, scaleY, resize)
    },

    rotate(e: IEditorRotateEvent): void {
        const { target, targetOrigin, rotation } = e
        target.rotateOf(targetOrigin, rotation)
    },

    skew(e: IEditorSkewEvent): void {
        const { target, targetOrigin, skewX, skewY } = e
        target.skewOf(targetOrigin, skewX, skewY)
    },

    update(editor: IEditor) {
        const { targetSimulate, targetList } = editor

        let target = targetList.list[0]

        if (editor.multiple) {
            target = targetSimulate
            targetSimulate.parent.updateLayout()
        }

        const { x, y, scaleX, scaleY, rotation, skewX, skewY, width, height } = target.getOrientBounds('box', 'world', editor, true)
        editor.box.set({ x, y, scaleX, scaleY, rotation, skewX, skewY })
        editor.box.update({ x: 0, y: 0, width, height })
    }

}