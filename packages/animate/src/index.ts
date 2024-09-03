export { Animate } from './Animate'
export { AnimateEasing } from './AnimateEasing'

import { IAnimate, IAnimateOptions, IKeyframe, IAnimation, IUIInputData, IKeyframesAnimation, IStyleAnimation } from '@leafer-ui/interface'
import { UI } from '@leafer-ui/draw'

import { Animate } from './Animate'


UI.prototype.animate = function (keyframe?: IUIInputData | IKeyframe[] | IAnimation, options?: IAnimateOptions | number, isTemp?: boolean): IAnimate {
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
    if (this.__animate) this.__animate.kill()
}