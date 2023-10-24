import { IUI } from '@leafer-ui/interface'
import { IEditorTool } from '@leafer-in/interface'

import { RectTool } from './RectTool'
import { LineTool } from './LineTool'


export function getTool(value: IUI | IUI[]): IEditorTool {
    return value instanceof Array || !(value.tag === 'Line' && value.resizeable) ? RectTool : LineTool
}