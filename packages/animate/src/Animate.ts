import { IAnimate, IAnimateOptions, IKeyframe, IComputedKeyframe, IAnimateEasing, IAnimateDirection, IAnimateEnding, IObject, IFunction, ITimer, IAnimateEvents } from '@leafer-ui/interface'
import { Platform } from '@leafer-ui/draw'

import { AnimateEasing } from './AnimateEasing'
import { animateAttr } from './decorator'


export class Animate implements IAnimate {

    public target: IObject
    public config: IAnimateOptions

    public from: IObject
    public to: IObject

    public began: boolean
    public running: boolean
    public completed: boolean
    public destroyed: boolean

    public now: number
    public looped: number


    @animateAttr('ease')
    public easing: IAnimateEasing

    @animateAttr('normal')
    public direction: IAnimateDirection

    @animateAttr(0)
    public delay: number

    @animateAttr(0.2)
    public duration: number

    @animateAttr(0)
    public endDelay: number

    @animateAttr('normal')
    public ending: IAnimateEnding

    @animateAttr(false)
    public loop: boolean | number

    @animateAttr(1)
    public speed: number

    @animateAttr(true)
    public autoplay: boolean

    @animateAttr()
    public fromBefore: boolean

    @animateAttr()
    public event?: IAnimateEvents


    protected list: IComputedKeyframe[]

    protected nowIndex: number
    protected get nowItem(): IComputedKeyframe { return this.list[this.nowIndex] }
    protected get nowTotalDuration(): number { return this.nowItem.totalDuration || this.nowItem.duration || 0 }

    protected easingFn: IFunction

    protected requestAnimateTime: number
    protected playedDuration: number

    protected isReverse: boolean
    protected timer: ITimer

    protected get realDelay() { return this.isReverse ? this.endDelay : this.delay }
    protected get realEndDelay() { return this.isReverse ? this.delay : this.endDelay }
    protected get alternate(): boolean { return this.direction.includes('alternate') }


    constructor(target: IObject, keyframes: IKeyframe | IKeyframe[], options?: IAnimateOptions | number) {
        if (typeof options === 'number') options = { duration: options }

        this.target = target
        this.config = options || {}
        this.list = []

        if (!keyframes) return

        this.setFirstDirection()
        this.easingFn = AnimateEasing.get(this.easing)
        this.create(keyframes instanceof Array ? keyframes : [keyframes])

        if (this.autoplay) this.play()
    }


    public play(): void {
        if (this.destroyed) return

        this.running = true
        if (!this.began) this.begin()
        else if (!this.timer) this.requestAnimate()
        this.emit('play')
    }

    public pause(): void {
        if (this.destroyed) return

        this.running = false
        this.clearTimer()
        this.emit('pause')
    }

    public stop(): void {
        if (this.destroyed) return

        this.end()
        this.complete()
        this.emit('stop')
    }

    public seek(time: number): void {
        if (this.destroyed) return

        time /= this.speed
        if (!this.began || time < this.now) this.begin(true)
        this.now = time

        this.animate(0, true)
        this.clearTimer(() => this.requestAnimate())
    }


    protected create(keyframes: IKeyframe[]): void {
        const { target, list } = this, { length } = keyframes, fromBefore = length > 1 ? this.fromBefore : true
        let addedDuration = 0, autoDuration = 0, before: IObject, keyframe: IKeyframe, item: IComputedKeyframe, style: IObject

        if (length > 1) this.from = {}, this.to = {}

        for (let i = 0; i < length; i++) {

            keyframe = keyframes[i]

            style = keyframe.style || keyframe
            if (!before) before = fromBefore ? target : style

            item = { style, before: {} }

            if (keyframe.style) { // with options

                const { duration, delay, endDelay, autoDelay, autoEndDelay, easing } = keyframe

                if (duration) {
                    item.duration = duration, addedDuration += duration
                    if (delay || endDelay) item.totalDuration = duration + (delay || 0) + (endDelay || 0)
                } else if (keyframe.autoDuration) item.autoDuration = keyframe.autoDuration, autoDuration += keyframe.autoDuration

                if (delay) item.delay = delay, addedDuration += delay
                else if (autoDelay) item.autoDelay = autoDelay, autoDuration += autoDelay

                if (endDelay) item.endDelay = endDelay, addedDuration += endDelay
                else if (autoEndDelay) item.autoEndDelay = autoEndDelay, autoDuration += autoEndDelay

                if (easing) item.easingFn = AnimateEasing.get(easing)

            }

            if (item.duration === undefined) {
                if (length > 1) (i > 0 || fromBefore) ? autoDuration++ : item.duration = 0 // 默认第一帧无时长
                else item.duration = this.duration
            }

            if (length > 1) {
                this.setBefore(item, style, before)
            } else {
                for (let key in style) { item.before[key] = target[key] }
                this.from = item.before, this.to = item.style
            }

            before = style
            list.push(item)
        }

        if (autoDuration) {
            this.allocateTime(Math.max(0, (this.duration - addedDuration) / autoDuration))
        } else {
            if (addedDuration) this.config.duration = addedDuration
        }

        this.emit('create')
    }

    public setBefore(item: IComputedKeyframe, data: IObject, before: IObject): void {
        const { target, from, to } = this // 同时生成完整的 from / to
        for (let key in data) {
            if (from[key] === undefined) from[key] = to[key] = target[key]
            item.before[key] = before[key] === undefined ? to[key] : before[key]
            to[key] = data[key]
        }
    }

    public allocateTime(partTime: number): void {
        this.list.forEach(item => {
            if (item.duration === undefined) {
                item.duration = item.autoDuration ? partTime * item.autoDuration : partTime

                if (item.autoDelay) item.delay = item.autoDelay * partTime
                if (item.autoEndDelay) item.endDelay = item.autoEndDelay * partTime

                if (item.delay || item.endDelay) {
                    item.totalDuration = item.duration
                    if (item.delay) item.totalDuration += item.delay
                    if (item.endDelay) item.totalDuration += item.endDelay
                }
            }
        })
    }


    protected requestAnimate(): void {
        this.requestAnimateTime = Date.now()
        Platform.requestRender(this.animate.bind(this))
    }

    protected animate(_runtime?: number, seek?: boolean): void {
        if (!seek) {
            if (!this.running) return
            this.now += (Date.now() - this.requestAnimateTime) / 1000
        }

        const { duration, loop } = this

        const realNow = this.now * this.speed

        if (realNow < duration) {

            while (realNow - this.playedDuration > this.nowTotalDuration) {
                this.transition(1)
                this.isReverse ? this.reverseNextItem() : this.nextItem()
            }

            const itemDelay = (this.isReverse ? this.nowItem.endDelay : this.nowItem.delay) || 0
            const itemPlayedTime = realNow - this.playedDuration - itemDelay

            if (itemPlayedTime > this.nowItem.duration) {
                this.transition(1)
            } else if (itemPlayedTime >= 0) {
                const t = itemPlayedTime / this.nowItem.duration
                this.transition(this.nowItem.easingFn ? this.nowItem.easingFn(t) : this.easingFn(t))
            }

        } else {

            this.end()
        }


        // next 

        if (!seek) {
            if (realNow < duration) {
                this.requestAnimate()
            } else {
                const { realEndDelay } = this

                if (loop || this.alternate) {

                    this.looped++

                    if (!(typeof loop === 'number' && this.looped >= loop)) {

                        if (this.alternate) this.isReverse = !this.isReverse
                        if (realEndDelay) this.timer = setTimeout(() => { this.timer = 0, this.begin() }, realEndDelay / this.speed * 1000)
                        else this.begin()

                        return
                    }
                }

                if (realEndDelay) this.timer = setTimeout(() => { this.timer = 0, this.complete() }, realEndDelay / this.speed * 1000)
                else this.complete()
            }
        }

    }

    protected begin(seek?: boolean): void {
        this.began = true
        this.completed = false
        this.playedDuration = this.now = 0

        this.isReverse ? this.setTo() : this.setFrom()
        this.transition(0)

        if (!seek) {
            const { realDelay } = this
            if (realDelay) this.timer = setTimeout(() => {
                this.timer = 0
                this.requestAnimate()
            }, realDelay / this.speed * 1000)
            else this.requestAnimate()
        }
    }

    protected end(): void {
        this.isReverse ? this.setFrom() : this.setTo()
        this.transition(1)
    }

    protected complete(): void {
        this.began = this.running = this.isReverse = false
        this.completed = true

        const { ending } = this
        if (ending === 'from') this.setFrom(), this.transition(0)
        else if (ending === 'to') this.setTo(), this.transition(1)

        this.clearTimer()
        this.emit('complete')
    }


    protected setFrom(): void {
        this.nowIndex = 0
        this.setStyle(this.from)
    }

    protected setTo(): void {
        this.nowIndex = this.list.length - 1
        this.setStyle(this.to)
    }


    protected nextItem(): void {
        if (this.nowIndex + 1 >= this.list.length) return
        this.playedDuration += this.nowTotalDuration
        this.nowIndex++
    }

    protected reverseNextItem(): void {
        if (this.nowIndex - 1 < 0) return
        this.playedDuration += this.nowTotalDuration
        this.nowIndex--
    }


    protected transition(t: number): void {
        const { target } = this
        const { style, before } = this.nowItem
        const fromStyle = this.isReverse ? style : before
        const toStyle = this.isReverse ? before : style

        if (t === 0) {
            this.setStyle(fromStyle)
        } else if (t === 1) {
            this.setStyle(toStyle)
        } else {
            let from: number
            for (let key in style) {
                from = fromStyle[key]
                target[key] = from + (toStyle[key] - from) * t
            }
        }

        this.emit('update')
    }

    protected setStyle(style: IObject): void {
        Object.assign(this.target, style)
    }

    protected setFirstDirection(): void {
        this.looped = 0
        this.isReverse = this.direction.includes('reverse')
    }

    protected clearTimer(fn?: IFunction): void {
        if (this.timer) {
            clearTimeout(this.timer), this.timer = 0
            if (fn) fn()
        }
    }

    protected emit(name: 'play' | 'pause' | 'stop' | 'create' | 'update' | 'complete'): void {
        const fn = this.event && this.event[name]
        if (fn) fn(this)
    }

    public destroy(complete?: boolean): void {
        if (!this.destroyed) {
            if (complete && !this.completed) this.stop()
            else this.pause()
            this.target = this.config = this.list = null
            this.destroyed = true
        }
    }

}