export { Finder } from './Finder'

import { ILeaf } from '@leafer-ui/interface'
import { Creator, LeafHelper, Plugin } from '@leafer-ui/draw'
import { Finder } from './Finder'
import './find'


Plugin.add('find')


Creator.finder = function (target, config) {
    return new Finder(target, config)
}

LeafHelper.cacheId = function (t: ILeaf): void {  // 创建时缓存id元素
    const { leafer, id } = t
    if (id) leafer.app.idMap[id] = t
    if (leafer.cacheInnerId) leafer.app.innerIdMap[t.innerId] = t

}