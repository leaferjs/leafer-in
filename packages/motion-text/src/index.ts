import { ITextData, ITextRowData, IText, ILeaferCanvas, IRenderOptions, IRotationPointData, IPathCommandData, IPointData } from '@leafer-ui/interface'
import { OneRadian, Paint, Plugin, PointHelper, Text, PathCommandDataHelper, PathBounds, BoundsHelper, AroundHelper } from '@leafer-ui/draw'

import { motionPathType } from '@leafer-in/motion-path'


Plugin.add('motion-text')

const tempPoint = {} as IPointData


Text.addAttr('motionText', undefined, motionPathType)


Text.prototype.__updateMotionText = function () {

    const t = this

    if (!t.__.__textDrawData) return

    const data = t.__ as ITextData, { motion, motionAround } = data, { rows, bounds } = data.__textDrawData


    let row: ITextRowData, motionData: IRotationPointData

    const base = this.getMotionPoint(motion)

    const textPath: IPathCommandData = [], pathPoint = {} as IPointData

    const pathElement = this.getMotionPath()

    let offsetX: number = 0, offsetY: number = 0
    if (motionAround && motionAround !== 'top-left') {
        AroundHelper.toPoint(motionAround, bounds, tempPoint)
        offsetX = -tempPoint.x * t.scaleX, offsetY = -tempPoint.y * t.scaleY
    }

    t.set({ x: base.x, y: base.y })
    if (t.scale != 1) t.scale = 1
    if (t.rotation) t.rotation = 0

    for (let i = 0, len = rows.length; i < len; i++) {
        row = rows[i]

        if (row.data) row.data.forEach((charData, index) => {
            motionData = charData.motion = this.getMotionPoint(motion, undefined, offsetX + charData.x, offsetY + row.y, pathElement)
            PointHelper.move(motionData, -base.x, -base.y)

            PointHelper.copy(pathPoint, motionData)
            PointHelper.toVertical(pathPoint, motionData.rotation, data.fontSize / 2)

            if (!index) {
                PathCommandDataHelper.moveTo(textPath, motionData.x, motionData.y)
            } else {
                PathCommandDataHelper.lineTo(textPath, motionData.x, motionData.y)

                if (index === row.data.length - 1) {
                    motionData = this.getMotionPoint(motion, undefined, offsetX + charData.x + charData.width, offsetY + row.y + data.fontSize / 2, pathElement)
                    PointHelper.move(motionData, -base.x, -base.y)
                    PathCommandDataHelper.lineTo(textPath, motionData.x, motionData.y)
                }
            }
        })
    }

    t.__.__pathForMotionText = textPath

    // 修改boxBounds
    PathBounds.toBounds(textPath, t.__layout.boxBounds)
    BoundsHelper.spread(t.__layout.boxBounds, data.fontSize)

    t.__layout.contentBounds = t.__layout.boxBounds
    t.__layout.resized = 'inner'

}

Paint.fillMotionText = function (ui: IText, canvas: ILeaferCanvas, _renderOptions: IRenderOptions): void {

    const data = ui.__, { rows } = data.__textDrawData // , decorationY 
    if (data.__isPlacehold && data.placeholderColor) canvas.fillStyle = data.placeholderColor

    let row: ITextRowData, motion: IRotationPointData
    const useRotation = data.motionRotation !== false

    for (let i = 0, len = rows.length; i < len; i++) {
        row = rows[i]

        if (row.data) row.data.forEach(charData => {

            motion = charData.motion

            if (useRotation) {
                canvas.setTransform(canvas.worldTransform)
                canvas.translate(motion.x, motion.y)
                canvas.rotate(motion.rotation * OneRadian)
                canvas.fillText(charData.char, 0, 0)
            } else {
                canvas.fillText(charData.char, motion.x, motion.y)
            }

        })
    }

}