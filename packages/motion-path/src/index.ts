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
    const { parent } = this

    if (!this.motionPath && parent) {
        const { children } = parent
        for (let i = 0; i < children.length; i++) {
            if (children[i].motionPath) return children[i].getMotionPathData()
        }
    }

    const data = this.__
    if (data.__pathForMotion) return data.__pathForMotion
    return data.__pathForMotion = HighCurveHelper.getMotionPathData(this.getPath(true, true))
}

ui.getMotionPoint = function (motionDistance: number | IUnitData): IRotationPointData {
    const data = this.getMotionPathData()
    const point = HighCurveHelper.getDistancePoint(data, motionDistance)
    MatrixHelper.toOuterPoint(this.localTransform, point)
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
    } else {
        updateMotion(this)
    }
}

function updateMotion(leaf: IUI): void {
    const { motion, motionRotation } = leaf
    if (isNull(motion)) return

    if (leaf.motionPath) {

        const data = leaf.getMotionPathData()
        if (data.total) leaf.__.__pathForRender = HighCurveHelper.getDistancePath(data, motion) // 生长路径

    } else {

        let child: IUI
        const { children } = leaf.parent
        for (let i = 0; i < children.length; i++) {
            child = children[i]
            if (child.motionPath) {
                const data = child.getMotionPathData()
                if (!data.total) return
                const point = child.getMotionPoint(motion)
                if (motionRotation === false) delete point.rotation
                else {
                    point.rotation += child.rotation
                    if (typeof motionRotation === 'number') point.rotation += motionRotation
                }

                leaf.set(point) // 动画路径
                break
            }
        }

    }
}