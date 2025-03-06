export { Arrow } from './Arrow'
export { ArrowData } from './data/ArrowData'
export { PathArrowModule } from './PathArrowModule'
export { PathMatrixHelper } from './PathMatrixHelper'
export { arrowType } from './decorator'

import { PathArrow, UI, Plugin } from '@leafer-ui/draw'
import { PathArrowModule } from './PathArrowModule'
import { arrowType } from './decorator'


Plugin.add('arrow')


// addAttr
UI.addAttr('startArrow', 'none', arrowType)
UI.addAttr('endArrow', 'none', arrowType)


Object.assign(PathArrow, PathArrowModule)