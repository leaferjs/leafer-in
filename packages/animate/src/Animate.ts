import { IAnimate, IAnimateOptions, IKeyframe, IUIInputData, IComputedKeyframe, IAnimateEasing, IAnimateEnding, IObject, IFunction, ITimer, IUI, IPercentData, ITransition, IBooleanMap, IEventMap } from '@leafer-ui/interface'
import { Platform, UnitConvert, useModule, LeafEventer, Eventer, Transition } from '@leafer-ui/draw'

import { AnimateEasing } from './AnimateEasing'
import { animateAttr } from './decorator'
import { AnimateEvent } from './AnimateEvent'


const frameDuration = 0.2

@useModule(LeafEventer)
export class Animate extends Eventer implements IAnimate {

    public target: IUI

    public keyframes: IKeyframe[]
    public config?: IAnimateOptions

    public fromStyle: IUIInputData
    public toStyle: IUIInputData
    public get endingStyle() { return this.realEnding === 'from' ? this.fromStyle : this.toStyle }

    public get started(): boolean { return !!this.requestAnimateTime }
    public running: boolean
    public get completed(): boolean { return this.time >= this.duration && !this.started }
    public destroyed: boolean

    public time: number
    public looped: number


    @animateAttr('ease')
    public easing: IAnimateEasing


    @animateAttr(0)
    public delay: number

    @animateAttr(frameDuration)
    public duration: number

    @animateAttr('auto')
    public ending: IAnimateEnding


    @animateAttr(false)
    public reverse?: boolean

    @animateAttr(false)
    public swing?: boolean

    @animateAttr(false)
    public loop: boolean | number

    @animateAttr(0)
    public loopDelay: number


    @animateAttr(1)
    public speed: number

    @animateAttr(true)
    public autoplay: boolean

    @animateAttr()
    public join: boolean

    @animateAttr()
    public attrs: string[]


    public isTemp: boolean

    public frames: IComputedKeyframe[]

    protected nowIndex: number
    protected get frame(): IComputedKeyframe { return this.frames[this.nowIndex] }
    protected get frameTotalTime(): number { return this.frame.totalTime || this.frame.duration || 0 }

    protected easingFn: IFunction

    protected requestAnimateTime: number
    protected playedTotalTime: number

    protected nowReverse: boolean
    protected timer: ITimer
    protected attrsMap: IBooleanMap

    public get realEnding(): IAnimateEnding {
        let count: number
        const { ending, reverse, loop } = this
        if (ending === 'from') count = 0
        else if (ending === 'to') count = 1
        else {
            count = reverse ? 0 : 1
            if (loop && typeof loop === 'number') count += loop - 1
        }
        return count % 2 ? 'to' : 'from'
    }


    constructor(target: IUI, keyframe: IUIInputData | IKeyframe[], options?: ITransition, isTemp?: boolean) {
        super()
        this.init(target, keyframe, options, isTemp)
    }


    public init(target: IUI, keyframe: IUIInputData | IKeyframe[], options?: ITransition, isTemp?: boolean): void {
        this.target = target
        if (isTemp || this.isTemp) this.isTemp = isTemp // 需要支持二次初始化
        switch (typeof options) {
            case 'number': this.config = { duration: options }; break
            case 'string': this.config = { easing: options }; break
            case 'object': this.config = options, options.event && (this.event = options.event as IEventMap)
        }

        if (!keyframe) return
        this.keyframes = keyframe instanceof Array ? keyframe : [keyframe]

        const { easing, attrs } = this
        this.easingFn = AnimateEasing.get(easing)
        if (attrs || this.attrsMap) this.attrsMap = attrs ? attrs.reduce((map, value) => { map[value] = true; return map }, {} as IBooleanMap) : undefined

        this.frames = []
        this.create()

        if (this.autoplay) this.timer = setTimeout(() => {
            this.timer = 0
            this.play()
        }, 0)
    }


    public play(): void {
        if (this.destroyed) return

        this.running = true
        if (!this.started) this.clearTimer(), this.start()
        else if (!this.timer) this.requestAnimate()
        this.emit(AnimateEvent.PLAY, this)
    }

    public pause(): void {
        if (this.destroyed) return

        this.running = false
        this.clearTimer()
        this.emit(AnimateEvent.PAUSE, this)
    }

    public stop(): void {
        if (this.destroyed) return

        this.end()
        this.complete()
        this.emit(AnimateEvent.STOP, this)
    }

    public seek(time: number | IPercentData): void {
        if (this.destroyed) return
        if (typeof time === 'object') time = UnitConvert.number(time, this.duration)

        if (time) time /= this.speed
        if (!this.started || time < this.time) this.start(true)
        this.time = time

        this.animate(0, true)
        this.clearTimer(() => this.requestAnimate())
        this.emit(AnimateEvent.SEEK, this)
    }

    public kill(): void {
        this.destroy(true)
    }


    protected create(): void {
        const { target, frames, keyframes, config } = this, { length } = keyframes, joinBefore = length > 1 ? this.join : true
        let addedDuration = 0, totalAutoDuration = 0, before: IObject, keyframe: IKeyframe, item: IComputedKeyframe, style: IObject

        if (length > 1) this.fromStyle = {}, this.toStyle = {}

        for (let i = 0; i < length; i++) {

            keyframe = keyframes[i]
            style = keyframe.style || keyframe

            if (!before) before = joinBefore ? target : style

            item = { style, beforeStyle: {} }

            if (keyframe.style) { // with options

                const { duration, autoDuration, delay, autoDelay, easing } = keyframe

                if (duration) {
                    item.duration = duration, addedDuration += duration
                    if (delay) item.totalTime = duration + delay
                } else {
                    if (autoDuration) item.autoDuration = autoDuration, totalAutoDuration += autoDuration
                }

                if (delay) item.delay = delay, addedDuration += delay
                else if (autoDelay) item.autoDelay = autoDelay, totalAutoDuration += autoDelay

                if (easing) item.easingFn = AnimateEasing.get(easing)

            }

            if (!item.autoDuration && item.duration === undefined) {
                if (length > 1) (i > 0 || joinBefore) ? totalAutoDuration++ : item.duration = 0 // fromNow不为true时，第一帧无时长
                else item.duration = this.duration
            }

            if (length > 1) {
                this.setBefore(item, style, before)
            } else {
                for (let key in style) { item.beforeStyle[key] = (target as IObject)[key] }
                this.fromStyle = item.beforeStyle, this.toStyle = item.style
            }

            before = style
            frames.push(item)
        }


        if (totalAutoDuration) {
            if (this.duration <= addedDuration || !(config && config.duration)) this.changeDuration(addedDuration + frameDuration * totalAutoDuration)
            this.allocateTime((this.duration - addedDuration) / totalAutoDuration)
        } else {
            if (addedDuration) this.changeDuration(addedDuration)
        }

        this.emit(AnimateEvent.CREATED, this)
    }

    public changeDuration(duration: number): void {
        const { config } = this
        this.config = config ? { ...config, duration } : { duration }
    }

    public setBefore(item: IComputedKeyframe, data: IObject, before: IObject): void {
        const { fromStyle, toStyle, target } = this // 同时生成完整的 from / to
        for (let key in data) {
            if (fromStyle[key] === undefined) fromStyle[key] = toStyle[key] = (data === before) ? before[key] : (target as IObject)[key]
            item.beforeStyle[key] = before[key] === undefined ? toStyle[key] : before[key]
            toStyle[key] = data[key]
        }
    }

    public allocateTime(partTime: number): void {
        let { frames } = this, { length } = frames, frame: IComputedKeyframe
        for (let i = 0; i < length; i++) {
            frame = frames[i]
            if (frame.duration === undefined) frame.duration = frame.autoDuration ? partTime * frame.autoDuration : partTime
            if (!frame.totalTime) {
                if (frame.autoDelay) frame.delay = frame.autoDelay * partTime
                if (frame.delay) frame.totalTime = frame.duration, frame.totalTime += frame.delay
            }
        }
    }


    protected requestAnimate(): void {
        this.requestAnimateTime = Date.now()
        Platform.requestRender(this.animate.bind(this))
    }

    protected animate(_runtime?: number, seek?: boolean): void {
        if (!seek) {
            if (!this.running) return
            this.time += (Date.now() - this.requestAnimateTime) / 1000
        }

        const { duration } = this, realTime = this.time * this.speed

        if (realTime < duration) {

            while (realTime - this.playedTotalTime > this.frameTotalTime) {
                this.transition(1)
                this.nowReverse ? this.reverseNextFrame() : this.nextFrame()
            }

            const itemDelay = this.nowReverse ? 0 : (this.frame.delay || 0)
            const itemPlayedTime = realTime - this.playedTotalTime - itemDelay
            const frameDuration = this.frame.duration

            if (itemPlayedTime > frameDuration) {
                this.transition(1)
            } else if (itemPlayedTime >= 0) {
                const t = frameDuration ? itemPlayedTime / frameDuration : 1
                this.transition(this.frame.easingFn ? this.frame.easingFn(t) : this.easingFn(t))
            }

        } else {

            this.end()
        }


        // next 

        if (!seek) {
            if (realTime < duration) {
                this.requestAnimate()
            } else {
                const { loop, loopDelay, swing } = this

                if (loop !== false || swing) {

                    this.looped ? this.looped++ : this.looped = 1

                    if (!(typeof loop === 'number' && (!loop || this.looped >= loop))) {

                        if (swing) this.nowReverse = !this.nowReverse

                        if (loopDelay) this.timer = setTimeout(() => { this.timer = 0, this.begin() }, loopDelay / this.speed * 1000)
                        else this.begin()

                        return
                    }
                }

                this.complete()
            }
        }

    }

    protected start(seek?: boolean): void {
        this.requestAnimateTime = 1 // started

        const { reverse } = this
        if (reverse || this.nowReverse) this.nowReverse = reverse
        if (this.looped) this.looped = 0

        if (seek) this.begin(true)
        else {
            const { delay } = this
            if (delay) this.timer = setTimeout(() => {
                this.timer = 0
                this.begin()
            }, delay / this.speed * 1000)
            else this.begin()
        }
    }

    protected begin(seek?: boolean): void {
        this.playedTotalTime = this.time = 0
        this.nowReverse ? this.setTo() : this.setFrom()
        if (!seek) this.requestAnimate()
    }

    protected end(): void {
        this.nowReverse ? this.setFrom() : this.setTo()
    }

    protected complete(): void {
        this.requestAnimateTime = 0
        this.running = false

        const { realEnding } = this
        if (realEnding === 'from') this.setFrom()
        else if (realEnding === 'to') this.setTo()

        this.clearTimer()
        this.emit(AnimateEvent.COMPLETED, this)
    }


    protected setFrom(): void {
        this.nowIndex = 0
        this.setStyle(this.fromStyle)
    }

    protected setTo(): void {
        this.nowIndex = this.frames.length - 1
        this.setStyle(this.toStyle)
    }


    protected nextFrame(): void {
        if (this.nowIndex + 1 >= this.frames.length) return
        this.playedTotalTime += this.frameTotalTime
        this.nowIndex++
    }

    protected reverseNextFrame(): void {
        if (this.nowIndex - 1 < 0) return
        this.playedTotalTime += this.frameTotalTime
        this.nowIndex--
    }


    protected transition(t: number): void {
        const { style, beforeStyle } = this.frame
        const fromStyle = this.nowReverse ? style : beforeStyle
        const toStyle = this.nowReverse ? beforeStyle : style

        if (t === 0) {
            this.setStyle(fromStyle)
        } else if (t === 1) {
            this.setStyle(toStyle)
        } else {

            const { attrsMap, target } = this
            let from: number, to: number, transitionAttr: IFunction, { betweenStyle } = this.frame

            if (!betweenStyle) betweenStyle = this.frame.betweenStyle = {}

            for (let key in style) {
                if (attrsMap && !attrsMap[key]) continue

                from = fromStyle[key], to = toStyle[key], transitionAttr = Transition.list[key] || Transition.value
                if (from !== to) betweenStyle[key] = transitionAttr(from, to, t, target)
            }

            this.setStyle(betweenStyle)
        }

        this.emit(AnimateEvent.UPDATE, this)
    }

    public setStyle(style: IObject): void {
        this.target.set(style, this.isTemp ? 'temp' : false)
    }

    protected clearTimer(fn?: IFunction): void {
        if (this.timer) {
            clearTimeout(this.timer), this.timer = 0
            if (fn) fn()
        }
    }

    public destroy(complete?: boolean): void {
        if (!this.destroyed) {
            super.destroy()

            if (complete && !this.completed) this.stop()
            else this.pause()
            this.target = this.config = this.frames = null
            this.destroyed = true
        }
    }

}