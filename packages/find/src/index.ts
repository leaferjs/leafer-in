export { Finder } from './Finder'

import { Creator } from '@leafer-ui/draw'
import { Finder } from './Finder'
import './find'

Creator.finder = function (target) {
    return new Finder(target)
}