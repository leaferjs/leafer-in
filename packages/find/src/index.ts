export { Finder } from './Finder'

import { Creator, Plugin } from '@leafer-ui/draw'
import { Finder } from './Finder'
import './find'


Plugin.add('find')


Creator.finder = function (target) {
    return new Finder(target)
}