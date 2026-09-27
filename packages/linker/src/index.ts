export { Linker } from './Linker'
export { LinkerData } from './data/LinkerData'

import { Plugin, registerPointsCurve } from '@leafer-ui/draw'
import { drawPoints } from './helper/drawPoints'


Plugin.add('linker')

registerPointsCurve('C', drawPoints)