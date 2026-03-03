import { ILeaf, IBoundsData } from '@leafer-ui/interface'
import { LeafHelper, MatrixHelper, MathHelper, BoundsHelper } from '@leafer-ui/draw'


const { scale } = MatrixHelper
const { copyAndSpread } = BoundsHelper
const { getScaleFixedData } = MathHelper

LeafHelper.updateScaleFixedWorld = function (t: ILeaf): void {
    const { __world, __ } = t, { scaleX, scaleY } = getScaleFixedData(__world, __.scaleFixed)
    if (scaleX !== 1) {
        scale(__world, scaleX, scaleY)
        __world.scaleX *= scaleX, __world.scaleY *= scaleY
    }
}

LeafHelper.updateOuterBounds = function (t: ILeaf): void {
    const layout = t.__layout, { localRenderBounds } = layout
    const localOuterBounds = layout.localOuterBounds || (layout.localOuterBounds = {} as IBoundsData)
    const { width, height } = localRenderBounds
    const scale = layout.outerScale - 1
    copyAndSpread(localOuterBounds, localRenderBounds, [height * scale, width * scale])
    if (t.parent) t.parent.__layout.renderChange()
}