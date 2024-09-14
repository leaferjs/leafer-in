export * from '@leafer-in/resize'

export { Flow } from './Flow'

import { BoundsHelper, Box, UI, autoLayoutType, boundsType } from '@leafer-ui/draw'

import { flowX } from './layout/flowX'
import { flowY } from './layout/flowY'
import { autoBoundsType } from './decorate'


const ui = UI.prototype, box = Box.prototype

// addAttr
autoLayoutType(false)(ui, 'flow')
boundsType(0)(ui, 'gap')
boundsType('top-left')(ui, 'flowAlign')
boundsType(false)(ui, 'flowWrap')

boundsType('box')(ui, 'itemBox')
boundsType(true)(ui, 'inFlow')

autoBoundsType()(ui, 'autoWidth')
autoBoundsType()(ui, 'autoHeight')
boundsType()(ui, 'lockRatio')
boundsType()(ui, 'autoBox')
boundsType()(ui, 'widthRange')
boundsType()(ui, 'heightRange')


const { copyAndSpread } = BoundsHelper
let doFlowX = flowX, doFlowY = flowY

box.__updateFlowLayout = function (): void {
    this.leafer.created = false
    const { flow } = this.__
    switch (flow) {
        case 'x':
        case true:
            doFlowX(this)
            break
        case 'y':
            doFlowY(this)
            break
        case 'x-reverse':
            doFlowX(this, true)
            break
        case 'y-reverse':
            doFlowY(this, true)
            break
    }
    this.leafer.created = true
}

box.__updateContentBounds = function (): void {
    const { padding } = this.__
    const layout = this.__layout
    const same = layout.contentBounds === layout.boxBounds

    if (padding) {
        if (same) layout.shrinkContent()
        copyAndSpread(layout.contentBounds, layout.boxBounds, padding, true)
    } else {
        if (!same) layout.shrinkContentCancel()
    }
}



