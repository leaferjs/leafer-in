export * from '@leafer-ui/scale'

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

export { EditToolCreator, EditTool, LineEditTool } from './tool'

export { EditorHelper } from './helper/EditorHelper'
export { EditDataHelper } from './helper/EditDataHelper'
export { EditSelectHelper } from './helper/EditSelectHelper'

import { IEditor, IEditorConfig } from '@leafer-in/interface'
import { Creator, Line } from '@leafer-ui/draw'

import { Editor } from './Editor'
import { EditToolCreator, EditTool, LineEditTool } from './tool'

Creator.editor = function (options?: IEditorConfig): IEditor { return new Editor(options) }

EditToolCreator.register(EditTool)
EditToolCreator.register(LineEditTool)

Line.prototype.getEditTool = function (): string {
    if (!this.points && !this.pathInputed) {
        return 'LineEditTool'
    } else {
        return 'EditTool'
    }
}
