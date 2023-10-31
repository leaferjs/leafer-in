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
        const { target, bounds, resizeType, old } = e
        const { x, y, width, height } = bounds
        const inner = { x: x - old.x, y: y - old.y } // boxBounds change

        const local = target.getLocalPointByInner(inner, null, true)
        target.x += local.x
        target.y += local.y

        if (resizeType === 'scale') {
            target.scaleX *= width / old.width
            target.scaleY *= height / old.height
        } else {

            if (width < 0) {
                target.width = -width
                target.scaleX *= -1
            } else {
                if (target.width !== width) target.width = width
            }

            if (height < 0) {
                target.height = -height
                target.scaleY *= -1
            } else {
                if (target.height !== height) target.height = height // Text auto height
            }

        }
    },

    rotate(e: IEditorRotateEvent): void {
        const { target, origin, rotation } = e
        target.rotateOf(origin, rotation)
    },

    skew(e: IEditorSkewEvent): void {
        const { target, origin, skewX, skewY } = e
        target.skewOf(origin, skewX, skewY)
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