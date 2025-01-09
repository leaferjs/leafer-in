export { Animate } from './Animate'
export { AnimateList } from './AnimateList'
export { AnimateEasing } from './AnimateEasing'
export { AnimateEvent } from './AnimateEvent'


import { IAnimate, IKeyframe, IAnimation, IUIInputData, ITransition, IAnimateType, IFunction } from '@leafer-ui/interface'
import { UI, State, dataType, Transition, Plugin } from '@leafer-ui/draw'

import '@leafer-in/color'

import { Animate } from './Animate'
import { animationType } from './decorator'
import { AnimateEvent } from './AnimateEvent'
import { TransitionList, TransitionModule } from './Transition'
import { AnimateList } from './AnimateList'


Plugin.add('animate', 'color')


State.canAnimate = true


// Transition
Object.assign(Transition, TransitionModule)
Object.assign(Transition.list, TransitionList)


const ui = UI.prototype


// addAttr
animationType()(ui, 'animation')
dataType()(ui, 'animationOut')

dataType(true)(ui, 'transition')
dataType()(ui, 'transitionOut')

ui.animate = function (keyframe?: IUIInputData | IKeyframe[] | IAnimation | IAnimation[], options?: ITransition, kill?: IAnimateType, isTemp?: boolean): IAnimate {
    if (keyframe === undefined) return this.__animate
    const isAnimationList = keyframe instanceof Array && !options && kill
    const animate = isAnimationList ? new AnimateList(this, keyframe as IAnimation[], isTemp) : new Animate(this, keyframe as IUIInputData | IKeyframe[] | IAnimation, options, isTemp)
    this.killAnimate(kill, animate.toStyle)

    return this.__animate = animate
}

ui.killAnimate = function (_type?: IAnimateType, killStyle?: IUIInputData): void {
    const animate = this.__animate
    if (animate) animate.kill(true, killStyle), this.__animate = null
}

ui.__runAnimation = function (type: 'in' | 'out', complete?: IFunction): void {
    this.animate(type === 'in' ? this.animation : this.animationOut, undefined, 'animation')
    if (complete) this.__animate.on(AnimateEvent.COMPLETED, complete)
}
