export { Animate } from './Animate'
export { AnimateEasing } from './AnimateEasing'

import { IMultiKeyframe, IAnimate, IAnimateOptions, IKeyframe, IAnimation } from '@leafer-ui/interface'
import { UI } from '@leafer-ui/draw'

import { Animate } from './Animate'


UI.prototype.animate = function (keyframe?: IMultiKeyframe | IAnimation, options?: IAnimateOptions | number): IAnimate {
    if (keyframe === undefined) return this.__animate

    if (typeof keyframe === 'object') {
        if ((keyframe as IAnimation).keyframes !== undefined) options = keyframe as IAnimation, keyframe = (keyframe as IAnimation).keyframes
        if (keyframe instanceof Array && typeof keyframe[0] === 'number') keyframe = keyframe.map(num => this.keyframes[num as number])
    }

    if (typeof keyframe === 'number') keyframe = this.keyframes[keyframe]

    this.killAnimate()
    this.__animate = new Animate(this, keyframe as IKeyframe | IKeyframe[], options)

    return this.__animate
}

UI.prototype.killAnimate = function (): void {
    if (this.__animate) this.__animate.destroy(true)
}