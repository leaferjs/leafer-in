import { IValue } from '@leafer-ui/interface'
import { decorateLeafAttr, attr, isNull } from '@leafer-ui/draw'

export function motionPathType(defaultValue?: IValue) {
    return decorateLeafAttr(defaultValue, (key: string) => attr({
        set(value: any) {
            this.__setAttr(key, value)
            this.__hasMotionPath = this.motionPath || !isNull(this.motion)
            this.__layout.matrixChanged || this.__layout.matrixChange()
        }
    }))
}