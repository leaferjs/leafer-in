import { IEditor, IEditorScaleEvent, IEditorRotateEvent, IEditTool, IEditorSkewEvent, IEditorMoveEvent } from '@leafer-in/interface'


export class EditTool implements IEditTool {

    static list: IEditTool[] = []

    public tag = 'EditTool'

    // 操作

    onMove(e: IEditorMoveEvent): void {
        const { moveX, moveY, editor } = e
        const { app, list } = editor
        app.lockLayout()
        list.forEach(target => {
            target.moveWorld(moveX, moveY)
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
                target.transformWorld(transform, resize)
            } else {
                target.scaleOfWorld(worldOrigin, scaleX, scaleY, resize)
            }
        })
        app.unlockLayout()
    }

    onRotate(e: IEditorRotateEvent): void {
        const { rotation, transform, worldOrigin, editor } = e
        const { app, list } = editor
        app.lockLayout()
        list.forEach(target => {
            const resize = editor.getEditSize(target) === 'size'
            if (transform) {
                target.transformWorld(transform, resize)
            } else {
                target.rotateOfWorld(worldOrigin, rotation)
            }
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
                target.transformWorld(transform, resize)
            } else {
                target.skewOfWorld(worldOrigin, skewX, skewY, resize)
            }
        })
        app.unlockLayout()
    }

    // 状态

    load(_editor: IEditor): void {

    }

    unload(_editor: IEditor): void {

    }

    update(editor: IEditor) {
        const { simulateTarget, element } = editor

        if (editor.multiple) simulateTarget.parent.updateLayout()

        const { x, y, scaleX, scaleY, rotation, skewX, skewY, width, height } = element.getLayoutBounds('box', editor, true)
        editor.editBox.set({ x, y, scaleX, scaleY, rotation, skewX, skewY })
        editor.editBox.update({ x: 0, y: 0, width, height })
    }

    // 细节

    enter(): void {

    }

    exit(): void {

    }

}