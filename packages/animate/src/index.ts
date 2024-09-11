export { Animate } from './Animate'
export { AnimateEasing } from './AnimateEasing'

import { IAnimate, IAnimateOptions, IKeyframe, IAnimation, IUIInputData, IKeyframesAnimation, IStyleAnimation, ITransition } from '@leafer-ui/interface'
import { UI, State } from '@leafer-ui/draw'
import '@leafer-in/color'

import { Animate } from './Animate'


State.canAnimate = true

UI.prototype.animate = function (keyframe?: IUIInputData | IKeyframe[] | IAnimation, options?: ITransition, isTemp?: boolean): IAnimate {
    if (keyframe === undefined) return this.__animate

    if (typeof keyframe === 'object') {
        if ((keyframe as IKeyframesAnimation).keyframes) options = keyframe as IAnimateOptions, keyframe = (keyframe as IKeyframesAnimation).keyframes
        else if ((keyframe as IStyleAnimation).style) options = keyframe as IAnimateOptions, keyframe = (keyframe as IStyleAnimation).style
    }

    this.killAnimate()
    this.__animate = new Animate(this, keyframe as IUIInputData | IKeyframe[], options, isTemp)

    return this.__animate
}

UI.prototype.killAnimate = function (): void {
    if (this.__animate) this.__animate.kill(), this.__animate = null
}