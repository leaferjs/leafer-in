import { IObject } from '@leafer-ui/interface'
import { Debug } from '@leafer-ui/draw'

import { IEditTool } from '@leafer-in/interface'


const debug = Debug.get('EditToolCreator')

export function registerEditTool() {
    return (target: IObject) => {
        EditToolCreator.register(target)
    }
}

export const EditToolCreator = {

    list: {} as IObject,

    register(EditTool: IObject): void {
        const { tag } = EditTool.prototype as IEditTool
        list[tag] ? debug.repeat(tag) : (list[tag] = EditTool)
    },

    get(tag: string): IEditTool {
        return new list[tag]()
    }

}

const { list } = EditToolCreator