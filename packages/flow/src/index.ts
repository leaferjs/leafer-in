export * from '@leafer-in/resize'

export { Flow } from './Flow'

import { BoundsHelper, Box, Group, UI, autoLayoutType, boundsType } from '@leafer-ui/draw'

import { flowX } from './layout/flowX'
import { flowY } from './layout/flowY'
import { autoBoundsType } from './decorate'


const ui = UI.prototype, box = Box.prototype, { __updateBoxBounds } = Group.prototype

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

box.__updateFlowLayout = function (): void {
    const { leaferIsCreated, flow } = this

    if (leaferIsCreated) this.leafer.created = false

    switch (flow) {
        case 'x':
        case true:
            flowX(this)
            break
        case 'y':
            flowY(this)
            break
        case 'x-reverse':
            flowX(this, true)
            break
        case 'y-reverse':
            flowY(this, true)
            break
    }

    if (leaferIsCreated) this.leafer.created = true
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

box.__updateBoxBounds = function (secondLayout?: boolean): void { // autoSide且自动布局时需要二次布局
    const data = this.__

    if (this.children.length) {

        const { flow } = data

        if (data.__autoSide) {

            // this.leafer.layouter.addExtra(this)

            flow && !secondLayout ? this.__updateRectBoxBounds() : __updateBoxBounds.call(this)

            const { boxBounds } = this.__layout

            if (!data.__autoSize) {
                if (data.__autoWidth) {
                    if (!flow) boxBounds.width += boxBounds.x, boxBounds.x = 0
                    boxBounds.height = data.height, boxBounds.y = 0
                } else {
                    if (!flow) boxBounds.height += boxBounds.y, boxBounds.y = 0
                    boxBounds.width = data.width, boxBounds.x = 0
                }
            }

            flow && secondLayout && data.padding && copyAndSpread(boxBounds, boxBounds, data.padding, false, data.__autoSize ? null : (data.__autoWidth ? 'width' : 'height'))

            this.__updateNaturalSize()

        } else {
            this.__updateRectBoxBounds()
        }

        if (flow) this.__updateContentBounds()

    } else {
        this.__updateRectBoxBounds()
    }
}



