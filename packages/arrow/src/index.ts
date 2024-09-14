export { Arrow } from './Arrow'
export { ArrowData } from './data/ArrowData'
export { PathArrowModule } from './PathArrowModule'
export { PathMatrixHelper } from './PathMatrixHelper'
export { arrowType } from './decorator'

import { PathArrow, UI } from '@leafer-ui/draw'
import { PathArrowModule } from './PathArrowModule'
import { arrowType } from './decorator'


const ui = UI.prototype

// addAttr
arrowType('none')(ui, 'startArrow')
arrowType('none')(ui, 'endArrow')

Object.assign(PathArrow, PathArrowModule)