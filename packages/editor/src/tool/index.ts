import { ILine, IUI } from '@leafer-ui/interface'
import { IEditTool } from '@leafer-in/interface'

import { EditTool } from './EditTool'
import { LineEditTool } from './LineEditTool'


export function getTool(value: IUI | IUI[]): IEditTool {
    return value instanceof Array || !(value.tag === 'Line' && !(value as ILine).points) ? new EditTool() : new LineEditTool()
}

export function addTool(tool: IEditTool): void {

}