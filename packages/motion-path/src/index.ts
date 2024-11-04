export { HighCurveHelper } from './HighCurveHelper'
export { HighBezierHelper } from './HighBezierHelper'
export { motionPathType } from './decorator'

import { IMotionPathData, IUI, IUnitData, IRotationPointData } from '@leafer-ui/interface'
import { isNull, MatrixHelper, Transition, UI, UnitConvert } from '@leafer-ui/draw'

import { HighCurveHelper } from './HighCurveHelper'
import { motionPathType } from './decorator'


Transition.register('motion', function (from: any, to: any, t: number, target: IUI): number {
    if (!from) from = 0
    else if (typeof from === 'object') from = UnitConvert.number(from, target.getMotionTotal())
    if (!to) to = 0
    else if (typeof to === 'object') to = UnitConvert.number(to, target.getMotionTotal())
    return Transition.number(from, to, t)
})


const ui = UI.prototype


// addAttr
motionPathType()(ui, 'motionPath')
motionPathType()(ui, 'motion')
motionPathType(true)(ui, 'motionRotation')


ui.getMotionPathData = function (): IMotionPathData {
    return getMotionPathData(getMotionPath(this))
}

ui.getMotionPoint = function (motionDistance: number | IUnitData): IRotationPointData {
    const path = getMotionPath(this)
    const data = getMotionPathData(path)
    if (!data.total) return {} as IRotationPointData

    const point = HighCurveHelper.getDistancePoint(data, motionDistance)
    MatrixHelper.toOuterPoint(path.localTransform, point)

    const { motionRotation } = this
    if (motionRotation === false) delete point.rotation
    else if (typeof motionRotation === 'number') point.rotation += motionRotation
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
            if (!isNull(child.motion)) updateMotion(child)
        }
    } updateMotion(this)
}


function updateMotion(leaf: IUI): void {
    const { motion } = leaf
    if (isNull(motion)) return

    if (leaf.motionPath) {

        const data = getMotionPathData(leaf)
        if (data.total) leaf.__.__pathForRender = HighCurveHelper.getDistancePath(data, motion) // 生长路径

    } else {

        let child: IUI
        const { children } = leaf.parent
        for (let i = 0; i < children.length; i++) {
            child = children[i]
            if (child.motionPath) {
                leaf.set(child.getMotionPoint(motion)) // 动画路径
                break
            }
        }

    }
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
    return data.__pathForMotion = HighCurveHelper.getMotionPathData(leaf.getPath(true, true))
}