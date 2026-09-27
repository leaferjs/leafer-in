import { Paint, Plugin, Rect, Box, RectData, DataHelper, MathHelper, BoxData } from '@leafer-ui/draw'
import { fillStroke } from './fillSroke'
import { createRectStrokePath } from './path'
import { strokeWidthType } from './decorator'
import { IRectData } from '@leafer-ui/interface'

Plugin.add('stroke-sides')

Rect.addAttr('strokeWidth', 1, strokeWidthType)
Box.addAttr('strokeWidth', 1, strokeWidthType)

Paint.fillStroke = fillStroke

const { stintSet } = DataHelper

Rect.prototype.__updatePath = Box.prototype.__updatePath = function (): void {
    const data = this.__
    if (data.__hasStrokeSides) {
        const { width, height, cornerRadius, strokeWidth, strokeAlign } = data
        data.__pathForStroke = data.__pathInputed ? undefined : createRectStrokePath(width, height, cornerRadius && MathHelper.fourNumber(cornerRadius), MathHelper.fourNumber(strokeWidth), strokeAlign)
    }
}

BoxData.prototype.__checkComplex = RectData.prototype.__checkComplex = function (): void {
    const t = this as IRectData
    stintSet(t, '__complex', (t.__isFills || t.__isStrokes || t.cornerRadius || t.__hasStrokeSides || t.__useEffect) as boolean)
}