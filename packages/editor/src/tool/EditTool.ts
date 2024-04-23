import { IObject } from '@leafer-ui/interface'

import { IEditor, IEditorScaleEvent, IEditorRotateEvent, IEditTool, IEditorSkewEvent, IEditorMoveEvent } from '@leafer-in/interface'
import { registerEditTool, EditToolCreator } from './EditToolCreator'


@registerEditTool()
export class EditTool implements IEditTool {

    static registerEditTool(tool: IObject) {
        EditToolCreator.register(tool)
    }


    public get tag() { return 'EditTool' }

    // 操作

    public onMove(e: IEditorMoveEvent): void {
        const { moveX, moveY, editor } = e
        const { app, list } = editor
        app.lockLayout()
        list.forEach(target => {
            target.moveWorld(moveX, moveY)
        })
        app.unlockLayout()
    }

    public onScale(e: IEditorScaleEvent): void {
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

    public onRotate(e: IEditorRotateEvent): void {
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

    public onSkew(e: IEditorSkewEvent): void {
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

    public load(_editor: IEditor): void {

    }

    public unload(_editor: IEditor): void {

    }

    public update(editor: IEditor) {
        const { simulateTarget, element } = editor

        if (editor.multiple) simulateTarget.parent.updateLayout()

        const { x, y, scaleX, scaleY, rotation, skewX, skewY, width, height } = element.getLayoutBounds('box', editor, true)
        editor.editBox.set({ x, y, scaleX, scaleY, rotation, skewX, skewY })
        editor.editBox.update({ x: 0, y: 0, width, height })
    }

}