import { ILeaferBase, ILeaferTypeList, ILeaferTypeFunction } from '@leafer-ui/interface'

import { Debug } from '@leafer-ui/core'

import { addViewport } from './type/viewport'
import { custom } from './type/custom'
import { design } from './type/design'
import { document } from './type/document'


const debug = Debug.get('LeaferTypeCreator')

export const LeaferTypeCreator = {

    list: {} as ILeaferTypeList,

    register(name: string, fn: ILeaferTypeFunction): void {
        list[name] && debug.repeat(name)
        list[name] = fn
    },

    run(name: string, leafer: ILeaferBase): void {
        const fn = list[name]
        fn && fn(leafer)
    }

}

const { list, register } = LeaferTypeCreator

register('viewport', addViewport)
register('custom', custom)
register('design', design)
register('document', document)