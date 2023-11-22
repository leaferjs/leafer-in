import { IPointData } from '@leafer-ui/interface'
import { IEditor, IEditorScaleEvent, IEditorRotateEvent, IEditTool, IEditorSkewEvent, IEditorMoveEvent } from '@leafer-in/interface'

export class EditTool implements IEditTool {

    static list: IEditTool[] = []

    public tag = 'EditTool'

    public scaleOfEvent: boolean

    getMirrorData(editor: IEditor): IPointData {
        const { scaleX, scaleY } = editor.editBox
        return {
            x: scaleX < 0 ? 1 : 0, // 1 = mirrorX
            y: scaleY < 0 ? 1 : 0
        }
    }

    onMove(e: IEditorMoveEvent): void {
        const { moveX, moveY, editor } = e
        const { app, list } = editor
        app.lockLayout()
        list.forEach(target => {
            const move = target.getLocalPoint({ x: moveX, y: moveY }, null, true)
            target.move(move.x, move.y)
        })
        app.unlockLayout()
    }

    onScale(e: IEditorScaleEvent): void {
        const { scaleX, scaleY, transform, worldOrigin, editor } = e
        const { app, list } = editor
        app.lockLayout()
        list.forEach(target => {
            const resize = editor.getEditSize(target) === 'size'
            if (transform) {
                target.transform(transform, resize)
            } else {
                target.scaleOf(target.getInnerPoint(worldOrigin), scaleX, scaleY, resize)
            }
        })
        app.unlockLayout()
    }

    onRotate(e: IEditorRotateEvent): void {
        const { rotation, worldOrigin, editor } = e
        const { app, list } = editor
        app.lockLayout()
        list.forEach(target => {
            target.rotateOf(target.getInnerPoint(worldOrigin), rotation)
        })
        app.unlockLayout()
    }

    onSkew(e: IEditorSkewEvent): void {
        const { skewX, skewY, transform, worldOrigin, editor } = e
        const { app, list } = editor
        app.lockLayout()
        list.forEach(target => {
            const resize = editor.getEditSize(target) === 'size'
            if (transform) {
                target.transform(transform, resize)
            } else {
                target.skewOf(target.getInnerPoint(worldOrigin), skewX, skewY, resize)
            }
        })
        app.unlockLayout()
    }

    update(editor: IEditor) {
        const { targetSimulate, element } = editor

        if (editor.multiple) targetSimulate.parent.updateLayout()

        const { x, y, scaleX, scaleY, rotation, skewX, skewY, width, height } = element.getLayoutBounds('box', editor, true)
        editor.editBox.set({ x, y, scaleX, scaleY, rotation, skewX, skewY })
        editor.editBox.update({ x: 0, y: 0, width, height })
    }

}