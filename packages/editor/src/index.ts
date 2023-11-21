export { Editor } from './Editor'

export { EditBox } from './display/EditBox'
export { EditPoint } from './display/EditPoint'
export { EditSelector } from './display/EditSelector'
export { SelectBox } from './display/SelectBox'
export { Stroker } from './display/Stroker'

export { EditEvent } from './event/EditEvent'
export { EditMoveEvent } from './event/EditMoveEvent'
export { EditScaleEvent } from './event/EditScaleEvent'
export { EditRotateEvent } from './event/EditRotateEvent'
export { EditSkewEvent } from './event/EditSkewEvent'

export { LineEditTool } from './tool/LineEditTool'
export { EditTool } from './tool/EditTool'

export { EditHelper } from './helper/EditHelper'
export { EditDataHelper } from './helper/EditDataHelper'
export { SelectHelper } from './helper/SelectHelper'


import { IEditorConfig } from '@leafer-ui/interface'
import { Creator } from '@leafer-ui/core'
import { IEditor } from '@leafer-in/interface'
import { Editor } from './Editor'

Creator.editor = function (options?: IEditorConfig): IEditor {
    return new Editor(options)
}