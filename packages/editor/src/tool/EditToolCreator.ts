import { IObject } from '@leafer-ui/interface'
import { Debug } from '@leafer-ui/draw'

import { IEditTool, IEditor } from '@leafer-in/interface'


const debug = Debug.get('EditToolCreator')

export function registerEditTool() {
    return (target: IObject) => {
        EditToolCreator.register(target)
    }
}

export const registerInnerEditor = registerEditTool

export const EditToolCreator = {

    // 默认名称
    EditTool: 'EditTool',
    LineEditTool: 'LineEditTool',
    PointsEditTool: 'PointsEditTool',

    list: {} as IObject,

    register(EditTool: IObject, name?: string): void {
        const { tag } = EditTool.prototype as IEditTool
        name || (name = tag)
        list[name] && debug.repeat(name)
        list[name] = EditTool
    },

    get(tag: string, editor: IEditor): IEditTool {
        return new list[tag](editor)
    }

}

const { list } = EditToolCreator