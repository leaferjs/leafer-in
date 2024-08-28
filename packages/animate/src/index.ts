export { Animate } from './Animate'
export { AnimateEasing } from './AnimateEasing'

import { IMultiKeyframe, IAnimate, IAnimateOptions, IKeyframe, IAnimation } from '@leafer-ui/interface'
import { UI } from '@leafer-ui/draw'

import { Animate } from './Animate'


UI.prototype.animate = function (keyframe: IMultiKeyframe | IAnimation, options?: IAnimateOptions | number): IAnimate {
    if (typeof keyframe === 'object') {
        if ((keyframe as IAnimation).keys) options = keyframe as IAnimation, keyframe = (keyframe as IAnimation).keys
        if (keyframe instanceof Array && typeof keyframe[0] === 'number') keyframe = keyframe.map(num => this.keyframes[num as number])
    } else if (typeof keyframe === 'number') keyframe = this.keyframes[keyframe]

    if (this.nowAnimate) this.nowAnimate.destroy(true)
    this.nowAnimate = new Animate(this, keyframe as IKeyframe | IKeyframe[], options)

    return this.nowAnimate
}