export { Editor } from './Editor'

export { EditBox } from './display/EditBox'
export { EditPoint } from './display/EditPoint'
export { EditSelect } from './display/EditSelect'
export { SelectArea } from './display/SelectArea'
export { Stroker } from './display/Stroker'


export { EditorEvent } from './event/EditorEvent'
export { EditorMoveEvent } from './event/EditorMoveEvent'
export { EditorScaleEvent } from './event/EditorScaleEvent'
export { EditorRotateEvent } from './event/EditorRotateEvent'
export { EditorSkewEvent } from './event/EditorSkewEvent'
export { EditorGroupEvent } from './event/EditorGroupEvent'
export { InnerEditorEvent } from './event/InnerEditorEvent'

export { EditToolCreator, registerEditTool, registerInnerEditor } from './tool/EditToolCreator'
export { InnerEditor } from './tool/InnerEditor'
export { EditTool } from './tool/EditTool'
export { LineEditTool } from './tool/LineEditTool'

export { EditorHelper } from './helper/EditorHelper'
export { EditDataHelper } from './helper/EditDataHelper'
export { EditSelectHelper } from './helper/EditSelectHelper'


import { IEditor, IEditorConfig, IEditToolFunction, IEditorConfigFunction } from '@leafer-in/interface'
import { Creator, UI, Group, Text, Box, dataType, Plugin } from '@leafer-ui/draw'

import '@leafer-in/resize'

import { Editor } from './Editor'


Plugin.add('editor', 'resize')


Creator.editor = function (options?: IEditorConfig): IEditor { return new Editor(options) }

Box.addAttr('textBox', false, dataType)

UI.addAttr('editConfig', undefined, dataType)
UI.addAttr('editOuter', (ui: UI) => ui.__.__isLinePath ? 'LineEditTool' : 'EditTool', dataType)

UI.addAttr('editInner', 'PathEditor', dataType)
Group.addAttr('editInner', '', dataType)  // 必须设为空
Text.addAttr('editInner', 'TextEditor', dataType)

UI.setEditConfig = function (config: IEditorConfig | IEditorConfigFunction): void { this.changeAttr('editConfig', config) }
UI.setEditOuter = function (toolName: string | IEditToolFunction): void { this.changeAttr('editOuter', toolName) }
UI.setEditInner = function (editorName: string | IEditToolFunction): void { this.changeAttr('editInner', editorName) }