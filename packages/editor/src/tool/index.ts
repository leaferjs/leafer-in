import { IUI } from '@leafer-ui/interface'
import { Line } from '@leafer-ui/draw'

import { IEditTool } from '@leafer-in/interface'

import { EditTool } from './EditTool'
import { LineEditTool } from './LineEditTool'


export function getEditTool(list: IUI[]): IEditTool {
    if (list.length === 1) {
        const leaf = list[0]
        if (leaf instanceof Line && !leaf.points && !leaf.pathInputed) {
            return new LineEditTool()
        } else {
            return new EditTool()
        }
    } else {
        return new EditTool()
    }
}