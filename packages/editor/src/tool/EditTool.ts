import { IEditorScaleEvent, IEditorRotateEvent, IEditTool, IEditorSkewEvent, IEditorMoveEvent } from '@leafer-in/interface'
import { defineKey } from '@leafer-ui/draw'

import { registerEditTool, EditToolCreator } from './EditToolCreator'
import { InnerEditor } from './InnerEditor'


@registerEditTool()
export class EditTool extends InnerEditor implements IEditTool {

    static registerEditTool(name?: string, changeTag?: boolean) {
        EditToolCreator.register(this, name)
        if (changeTag) defineKey(this.prototype, 'tag', { get() { return name } })
    }


    public get tag() { return 'EditTool' }

    // 操作

    public onMove(e: IEditorMoveEvent): void {
        if (this.isMotionElement && this.onMoveMotion(e)) return
        if (this.isFlowElement && this.onMoveFlow(e)) return

        const { moveX, moveY, editor } = e
        const { app, list } = editor
        app.lockLayout()
        list.forEach(target => { target.moveWorld(moveX, moveY) })
        app.unlockLayout()
    }

    public onScale(e: IEditorScaleEvent): void {
        if (this.isFlowElement && this.onScaleFlow(e)) return

        const { scaleX, scaleY, transform, worldOrigin, editor } = e
        const { app, list } = editor
        app.lockLayout()
        list.forEach(target => {
            const resize = editor.getEditSize(target) !== 'scale'
            if (transform) target.transformWorld(transform, resize, false)
            else target.scaleOfWorld(worldOrigin, scaleX, scaleY, resize, false)
        })
        app.unlockLayout()
    }

    public onRotate(e: IEditorRotateEvent): void {
        if (this.isFlowElement && this.onRotateFlow(e)) return

        const { rotation, transform, worldOrigin, editor } = e
        const { app, list } = editor
        app.lockLayout()
        list.forEach(target => {
            const resize = editor.getEditSize(target) !== 'scale'
            if (transform) target.transformWorld(transform, resize, false)
            else target.rotateOfWorld(worldOrigin, rotation)
        })
        app.unlockLayout()
    }

    public onSkew(e: IEditorSkewEvent): void {
        if (this.isFlowElement && this.onSkewFlow(e)) return

        const { skewX, skewY, transform, worldOrigin, editor } = e
        const { app, list } = editor
        app.lockLayout()
        list.forEach(target => {
            const resize = editor.getEditSize(target) !== 'scale'
            if (transform) target.transformWorld(transform, resize, false)
            else target.skewOfWorld(worldOrigin, skewX, skewY, resize)
        })
        app.unlockLayout()
    }

    // 状态

    public load(): void {
        if (this.editor) {
            this.editBox.view.visible = true
            this.onLoad()
        }
    }

    public unload(): void {
        if (this.editor) {
            this.editBox.view.visible = false
            this.unloadEditBoxConfig()
            this.onUnload()
        }
    }

}


export interface EditTool {
    // 扩展
    readonly isMotionElement?: boolean
    readonly isFlowElement?: boolean

    onMoveMotion(e: IEditorMoveEvent): boolean
    onMoveFlow(e: IEditorMoveEvent): boolean
    onScaleFlow(e: IEditorScaleEvent): boolean
    onRotateFlow(e: IEditorRotateEvent): boolean
    onSkewFlow(e: IEditorSkewEvent): boolean
}