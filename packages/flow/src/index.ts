export * from '@leafer-in/resize'

export { Flow } from './Flow'

import { BoundsHelper, Box, UI } from '@leafer-ui/draw'

import { flowX } from './layout/flowX'
import { flowY } from './layout/flowY'
import { autoBoundsType } from './decorate'


const { copyAndSpread } = BoundsHelper
let doFlowX = flowX, doFlowY = flowY

UI.changeAttr('autoWidth', undefined, autoBoundsType)
UI.changeAttr('autoHeight', undefined, autoBoundsType)

Box.prototype.__updateFlowLayout = function (): void {
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

Box.prototype.__updateContentBounds = function (): void {
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



