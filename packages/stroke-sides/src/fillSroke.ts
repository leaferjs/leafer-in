import { ILeaferCanvas, IRenderOptions } from '@leafer/interface'
import { isObject, PathDrawer } from "@leafer/core"

import { IUI, ILeafPaint, ILeafStrokePaint } from '@leafer-ui/interface'
import { PaintImage } from "@leafer-ui/draw"


export function fillStroke(stroke: string | ILeafPaint[], ui: IUI, canvas: ILeaferCanvas, renderOptions: IRenderOptions): void {

    canvas.beginPath()
    const { data, windingRule } = ui.__.__pathForStroke
    PathDrawer.drawPathByData(canvas, data)

    if (isObject(stroke)) {
        drawStrokesStyle(stroke, ui, canvas, renderOptions)
    } else {

        canvas.fillStyle = stroke
        windingRule ? canvas.fill(windingRule) : canvas.fill()

    }

    if (ui.__.__fillAfterStroke) ui.__drawRenderPath(canvas)
}


function drawStrokesStyle(strokes: ILeafStrokePaint[], ui: IUI, canvas: ILeaferCanvas, renderOptions: IRenderOptions): void {
    let item: ILeafStrokePaint

    for (let i = 0, len = strokes.length; i < len; i++) {
        item = strokes[i]

        if (item.image && PaintImage.checkImage(item, false, ui, canvas, renderOptions)) continue

        if (item.style) {

            const { windingRule } = ui.__.__pathForStroke

            if (item.originPaint.blendMode) {
                canvas.saveBlendMode(item.originPaint.blendMode)
                canvas.fillStyle = item.style
                windingRule ? canvas.fill(windingRule) : canvas.fill()
                canvas.restoreBlendMode()
            } else {
                canvas.fillStyle = item.style
                windingRule ? canvas.fill(windingRule) : canvas.fill()
            }
        }
    }
}