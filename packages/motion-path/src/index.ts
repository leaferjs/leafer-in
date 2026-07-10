export { HighCurveHelper } from './HighCurveHelper'
export { HighBezierHelper } from './HighBezierHelper'
export { motionPathType } from './decorator'

import { IMotionPathData, IMotionVertical, IUI, IUnitData, IRotationPointData, IPercentData, IMotionVerticalType } from '@leafer-ui/interface'
import { isNull, MatrixHelper, LeafHelper, BranchHelper, Transition, UI, UnitConvert, Plugin, isObject, isNumber, PointHelper } from '@leafer-ui/draw'

import { HighCurveHelper } from './HighCurveHelper'
import { motionPathType } from './decorator'


Plugin.add('motion-path')


Transition.register('motion', function (from: number | IPercentData, to: number | IPercentData, t: number, target: IUI): number {
    if (isObject(from)) from = UnitConvert.number(from, target.getMotionTotal())
    if (isObject(to)) to = UnitConvert.number(to, target.getMotionTotal())
    return Transition.number(from || 0, to || 0, t)
})

Transition.register('motionRotation', function (from: any, to: any, t: number): number {
    return Transition.number(from, to, t)
})


const ui = UI.prototype
const { updateMatrix, updateAllMatrix } = LeafHelper
const { updateBounds } = BranchHelper
const { toVertical } = PointHelper


// addAttr
UI.addAttr('motionPath', undefined, motionPathType)
UI.addAttr('motionPrecision', 1, motionPathType)

UI.addAttr('motion', undefined, motionPathType)
UI.addAttr('motionVertical', 'below', motionPathType)
UI.addAttr('motionRotation', true, motionPathType)


ui.getMotionPath = function (): IUI {
    return getMotionPath(this)
}

ui.getMotionPathData = function (): IMotionPathData {
    return getMotionPathData(getMotionPath(this))
}

ui.getMotionContentHeight = function (): number {
    return this.__layout.boxBounds.height
}

ui.getMotionPoint = function (motionDistance: number | IUnitData, motionVertical?: IMotionVertical, pathElement?: IUI, offsetX: number = 0, offsetY: number = 0): IRotationPointData {
    if (!pathElement) pathElement = getMotionPath(this)
    const data = getMotionPathData(pathElement)
    if (!data.total) return {} as IRotationPointData

    const point = HighCurveHelper.getDistancePoint(data, motionDistance, pathElement.motionPrecision, offsetX)

    const { motionRotation } = this
    if (isNumber(motionRotation)) point.rotation += motionRotation

    let verticalType: IMotionVerticalType, verticalOffset: number

    if (isObject(motionVertical)) verticalType = motionVertical.type, verticalOffset = motionVertical.offset
    else if (isNumber(motionVertical)) verticalOffset = motionVertical
    else verticalType = motionVertical

    if (verticalType !== 'below' || offsetY) {

        const { rotation } = point, height = this.getMotionContentHeight()
        if (verticalOffset) offsetY += verticalType === 'above' ? -verticalOffset : verticalOffset

        switch (verticalType) {
            case 'above':
                toVertical(point, rotation, -height + offsetY); break
            case 'center':
                toVertical(point, rotation, -height / 2 + offsetY); break
            case 'below':
            default:
                toVertical(point, rotation, offsetY)
        }
    }

    MatrixHelper.toOuterPoint(pathElement.localTransform, point)

    return point
}

ui.getMotionTotal = function (): number {
    return this.getMotionPathData().total
}

ui.__updateMotionPath = function (): void {
    const data = this.__
    if (this.__layout.resized && data.__pathForMotion) data.__pathForMotion = undefined

    if (this.motionPath) {
        let child: IUI
        const { children } = this.parent
        for (let i = 0; i < children.length; i++) {
            child = children[i]
            if (!isNull(child.motion) && !child.__layout.matrixChanged) {
                if (child !== this) child.__extraUpdate()
                updateMotion(child)
            }
        }
    } else updateMotion(this)
}


function updateMotion(leaf: IUI): void {
    const { motion, leaferIsCreated } = leaf
    if (isNull(motion)) return

    if (leaferIsCreated) leaf.leafer.created = false // 拦截布局更新通知，进行手动更新布局

    if (leaf.motionPath) {

        const data = getMotionPathData(leaf)
        if (data.total) leaf.__.__pathForRender = HighCurveHelper.getDistancePath(data, motion, leaf.motionPrecision) // 生长路径

    } else {

        if (leaf.motionText) leaf.__updateMotionText() // 扩展文本路径
        else {
            const point = leaf.getMotionPoint(motion)
            if (leaf.motionRotation === false) delete point.rotation
            leaf.set(point) // 动画路径
        }

        if (!leaf.__hasAutoLayout) { // 手动更新布局
            if (leaf.isBranch) updateAllMatrix(leaf), updateBounds(leaf, leaf)
            else updateMatrix(leaf)
        }

    }

    if (leaferIsCreated) leaf.leafer.created = true
}

function getMotionPath(leaf: IUI): IUI {
    const { parent } = leaf
    if (!leaf.motionPath && parent) {
        const { children } = parent
        for (let i = 0; i < children.length; i++) {
            if (children[i].motionPath) return children[i]
        }
    }
    return leaf
}

function getMotionPathData(leaf: IUI): IMotionPathData {
    const data = leaf.__
    if (data.__pathForMotion) return data.__pathForMotion
    const path = data.__pathForMotion = HighCurveHelper.getMotionPathData(leaf.getPath(true, true))
    return path
}