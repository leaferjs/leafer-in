import { IGroup, IEventListenerId, IUI, IObject, IPointData, IEditorConfig, OptionalKeys } from '@leafer-ui/interface'
import { IInnerEditor, IEditor, IEditBox, IInnerEditorMode, IInnerEditorConfig } from '@leafer-in/interface'

import { Group, PointHelper } from '@leafer-ui/draw'
import { EditToolCreator } from './EditToolCreator'
import { editToolMergeConfigAttr } from '../decorator/data'


const { abs } = Math, { scale } = PointHelper

export class InnerEditor implements IInnerEditor {

    static registerInnerEditor() {
        EditToolCreator.register(this)
    }


    public get tag() { return 'InnerEditor' }

    public get mode(): IInnerEditorMode { return 'focus' } // 专注模式

    public editTarget: IUI
    public editConfig?: IEditorConfig

    public config: IInnerEditorConfig
    public get userConfig(): IObject { return (this.editBox.mergeConfig[this.tag] || {}) }

    @editToolMergeConfigAttr()
    public readonly mergeConfig: IInnerEditorConfig
    public readonly mergedConfig: IInnerEditorConfig

    public configKeepKeys: OptionalKeys<IInnerEditorConfig>[] = ['editBox']

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


    public showView(): void {
        this.view.opacity = 1
    }

    public hideView(): void {
        this.view.opacity = 0
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
    public update(): void {
        if (this.editor) {
            this.updateEditBoxConfig()
            this.onUpdate()
        }
    }

    public onUnload(): void { }
    public unload(): void {
        const { editor } = this
        if (editor) {
            this.unloadEditBoxConfig()
            if (editor.app && this.mode === 'focus') editor.selector.hittable = editor.app.tree.hitChildren = true
            this.onUnload()
        }
    }

    public updateEditBoxConfig(): void {
        const { mergeConfig } = this
        if (mergeConfig) this.editBox.config = mergeConfig.editBox
    }

    public unloadEditBoxConfig(): void {
        this.editBox.config = undefined
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