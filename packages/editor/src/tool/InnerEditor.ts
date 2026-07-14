import { IGroup, IEventListenerId, IUI, IObject, IPointData, IEditorConfig } from '@leafer-ui/interface'
import { IInnerEditor, IEditor, IEditBox, IInnerEditorMode } from '@leafer-in/interface'

import { Group, PointHelper } from '@leafer-ui/draw'
import { EditToolCreator } from './EditToolCreator'


const { abs } = Math, { scale } = PointHelper

export class InnerEditor implements IInnerEditor {

    static registerInnerEditor() {
        EditToolCreator.register(this)
    }


    public get tag() { return 'InnerEditor' }

    public get mode(): IInnerEditorMode { return 'focus' } // 专注模式

    public editTarget: IUI
    public editConfig?: IEditorConfig

    public config: IObject
    public get userConfig(): IObject { return (this.editBox.mergeConfig[this.tag] || {}) }

    public editor: IEditor

    protected _editBox: IEditBox
    public get editBox(): IEditBox { return this._editBox || this.editor.editBox } // 编辑框，默认为editor.editBox
    public set editBox(value: IEditBox) { this._editBox = value }

    public view: IGroup

    public eventIds: IEventListenerId[] = []


    constructor(editor: IEditor) {
        this.editor = editor
        this.create()
    }


    public getEditBoxPoint(editTargetPoint: IPointData, change?: boolean): IPointData {
        const point = change ? editTargetPoint : { x: editTargetPoint.x, y: editTargetPoint.y }, { scaleX, scaleY } = this.editTarget.worldTransform
        scale(point, abs(scaleX), abs(scaleY))
        return point
    }

    public getEditTargetPoint(editBoxPoint: IPointData, change?: boolean): IPointData {
        const point = change ? editBoxPoint : { x: editBoxPoint.x, y: editBoxPoint.y }, { scaleX, scaleY } = this.editTarget.worldTransform
        scale(point, Math.abs(1 / scaleX), abs(1 / scaleY))
        return point
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