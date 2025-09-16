export { Animate } from './Animate'
export { AnimateList } from './AnimateList'
export { AnimateEasing } from './AnimateEasing'
export { AnimateEvent } from './AnimateEvent'


import { IAnimate, IKeyframe, IAnimation, IUIInputData, ITransition, IAnimateType, IFunction } from '@leafer-ui/interface'
import { UI, State, dataType, Transition, Plugin, isArray, isUndefined } from '@leafer-ui/draw'

import '@leafer-in/color'

import { Animate } from './Animate'
import { animationType } from './decorator'
import { AnimateEvent } from './AnimateEvent'
import { TransitionModule, TransitionList } from './Transition'
import { AnimateList } from './AnimateList'


Plugin.add('animate', 'color')


State.canAnimate = true


// Transition
Object.assign(Transition.list, TransitionList)
Object.assign(Transition, TransitionModule)


const ui = UI.prototype


// addAttr
UI.addAttr('animation', undefined, animationType)
UI.addAttr('animationOut', undefined, dataType)

UI.addAttr('transition', true, dataType)
UI.addAttr('transitionOut', undefined, dataType)

// @leafer-in/state will rewrite
ui.set = function (data: IUIInputData, transition?: ITransition | 'temp'): void {
    if (data) {
        if (transition) {
            if (transition === 'temp') {
                this.lockNormalStyle = true
                Object.assign(this, data)
                this.lockNormalStyle = false
            } else this.animate(data, transition)
        } else Object.assign(this, data)
    }
}

ui.animate = function (keyframe?: IUIInputData | IKeyframe[] | IAnimation | IAnimation[], options?: ITransition, kill?: IAnimateType, isTemp?: boolean): IAnimate {
    if (isUndefined(keyframe)) return this.__animate

    const isAnimationList = isArray(keyframe) && !options && kill
    let nextAnimate = isAnimationList ? new AnimateList(this, keyframe as IAnimation[], isTemp) : new Animate(this, keyframe as IUIInputData | IKeyframe[] | IAnimation, options, isTemp)

    this.killAnimate(kill, nextAnimate.toStyle)

    const animate = this.__animate
    if (animate) {
        if (nextAnimate instanceof AnimateList) nextAnimate.list.unshift(animate)
        else nextAnimate = new AnimateList(this, [animate, nextAnimate])
    }

    return this.__animate = nextAnimate
}

ui.killAnimate = function (_type?: IAnimateType, nextStyle?: IUIInputData): void {
    const animate = this.__animate
    if (animate) {
        let kill = false
        if (nextStyle && !animate.completed) {
            if (animate instanceof AnimateList) animate.updateList()
            const { toStyle } = animate
            for (let key in nextStyle) if (key in toStyle) { kill = true; break }
        } else kill = true
        if (kill) animate.kill(true, nextStyle), this.__animate = null
    }
}

ui.__runAnimation = function (type: 'in' | 'out', complete?: IFunction): void {
    this.animate(type === 'in' ? this.animation : this.animationOut, undefined, 'animation')
    if (complete) this.__animate.on(AnimateEvent.COMPLETED, complete)
}
