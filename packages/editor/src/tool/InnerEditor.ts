import { IGroup, IEventListenerId, IUI } from '@leafer-ui/interface'
import { IInnerEditor, IEditor, IEditBox } from '@leafer-in/interface'

import { Group } from '@leafer-ui/draw'
import { EditToolCreator } from './EditToolCreator'

export class InnerEditor implements IInnerEditor {

    static registerInnerEditor() {
        EditToolCreator.register(this)
    }


    public get tag() { return 'InnerEditor' }

    public editTarget: IUI

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
        this.editor.selector.hittable = this.editor.app.tree.hitChildren = false
        this.onLoad()
    }

    public onUpdate(): void { }
    public update(): void { this.onUpdate() }

    public onUnload(): void { }
    public unload(): void {
        this.editor.selector.hittable = this.editor.app.tree.hitChildren = true
        this.onUnload()
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