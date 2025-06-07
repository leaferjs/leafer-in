import { IGroup, IEventListenerId, IUI, IObject } from '@leafer-ui/interface'
import { IInnerEditor, IEditor, IEditBox, IInnerEditorMode } from '@leafer-in/interface'

import { Group } from '@leafer-ui/draw'
import { EditToolCreator } from './EditToolCreator'

export class InnerEditor implements IInnerEditor {

    static registerInnerEditor() {
        EditToolCreator.register(this)
    }


    public get tag() { return 'InnerEditor' }

    public get mode(): IInnerEditorMode { return 'focus' } // 专注模式

    public editTarget: IUI

    public config: IObject

    public editor: IEditor
    public get editBox(): IEditBox { return this.editor.editBox }

    public view: IGroup

    public eventIds: IEventListenerId[]


    constructor(editor: IEditor) {
        this.editor = editor
        this.create()
    }


    public onCreate(): void { }
    public create(): void {
        this.view = new Group()
        this.onCreate()
    }


    // 状态

    public onLoad(): void { }
    public load(): void {
        const { editor } = this
        if (editor) {
            if (editor.app && this.mode === 'focus') editor.selector.hittable = editor.app.tree.hitChildren = false
            this.onLoad()
        }
    }

    public onUpdate(): void { }
    public update(): void { this.onUpdate() }

    public onUnload(): void { }
    public unload(): void {
        const { editor } = this
        if (editor) {
            if (editor.app && this.mode === 'focus') editor.selector.hittable = editor.app.tree.hitChildren = true
            this.onUnload()
        }
    }

    public onDestroy(): void { }
    public destroy(): void {
        this.onDestroy()
        if (this.editor) {
            if (this.view) this.view.destroy()
            if (this.eventIds) this.editor.off_(this.eventIds)
            this.editor = this.view = this.eventIds = null
        }
    }

}