export { Animate } from './Animate'
export { AnimateEasing } from './AnimateEasing'
export { AnimateEvent } from './AnimateEvent'

import { IAnimate, IAnimateOptions, IKeyframe, IAnimation, IUIInputData, IKeyframesAnimation, IStyleAnimation, ITransition, IAnimateType, IFunction } from '@leafer-ui/interface'
import { UI, State, dataType } from '@leafer-ui/draw'
import '@leafer-in/color'

import { Animate } from './Animate'
import { animationType } from './decorator'
import { AnimateEvent } from './AnimateEvent'


State.canAnimate = true


const ui = UI.prototype


// addAttr
animationType()(ui, 'animation')
dataType()(ui, 'animationOut')

dataType(true)(ui, 'transition')
dataType()(ui, 'transitionOut')

ui.animate = function (keyframe?: IUIInputData | IKeyframe[] | IAnimation, options?: ITransition, kill?: IAnimateType, isTemp?: boolean): IAnimate {
    if (keyframe === undefined) return this.__animate

    if (typeof keyframe === 'object') {
        if ((keyframe as IKeyframesAnimation).keyframes) options = keyframe as IAnimateOptions, keyframe = (keyframe as IKeyframesAnimation).keyframes
        else if ((keyframe as IStyleAnimation).style) options = keyframe as IAnimateOptions, keyframe = (keyframe as IStyleAnimation).style
    }

    this.killAnimate(kill)
    return this.__animate = new Animate(this, keyframe as IUIInputData | IKeyframe[], options, isTemp)
}

ui.killAnimate = function (_type?: IAnimateType): void {
    const animate = this.__animate
    if (animate) animate.kill(), this.__animate = null
}

ui.__runAnimation = function (type: 'in' | 'out', complete?: IFunction): void {
    this.animate(type === 'in' ? this.animation : this.animationOut)
    if (complete) this.__animate.on(AnimateEvent.COMPLETE, complete)
}
