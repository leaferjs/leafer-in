import { IUIInputData, IObject, IUI, IPercentData, IAnimation, IAnimate, IFunction, IAnimateList } from '@leafer-ui/interface'
import { useModule, LeafEventer } from '@leafer-ui/draw'

import { Animate } from './Animate'
import { AnimateEvent } from './AnimateEvent'


@useModule(LeafEventer)
export class AnimateList extends Animate implements IAnimateList {

    public list: IAnimate[] = []

    public get completed(): boolean { return this.list.every(item => item.completed) }

    public get endingStyle() { return this._endingStyle }
    protected _endingStyle: IUIInputData


    constructor(target: IUI | IObject, animation?: IAnimation[] | IAnimate[], isTemp?: boolean) {
        super(target, null)
        this.updateList(animation, isTemp)
    }


    public updateList(animation?: IAnimation[] | IAnimate[], isTemp?: boolean) {
        this.fromStyle = {}
        this.toStyle = {}
        this._endingStyle = {}

        if (!animation) animation = this.list.filter(item => {
            const { completed } = item
            if (completed) item.destroy()
            return !completed
        })

        this.list = animation.map(item => {
            const animate = (item as IAnimate).target ? item as IAnimate : new Animate(this.target, item, isTemp)
            animate.parent = this
            Object.assign(this.fromStyle, animate.fromStyle)
            Object.assign(this.toStyle, animate.toStyle)
            Object.assign(this._endingStyle, animate.endingStyle)
            return animate
        })
    }

    public override play(): void {
        this.each(item => item.play())
        this.emitType(AnimateEvent.PLAY)
    }

    public override pause(): void {
        this.each(item => item.pause())
        this.emitType(AnimateEvent.PAUSE)
    }

    public override stop(): void {
        this.each(item => item.stop())
        this.emitType(AnimateEvent.STOP)
    }

    public override seek(time: number | IPercentData): void {
        this.each(item => item.seek(time))
        this.emitType(AnimateEvent.SEEK)
    }

    public override kill(complete?: boolean, killStyle?: IUIInputData): void {
        this.each(item => item.kill(complete, killStyle))
        this.destroy()
    }

    public onChildEvent(type: string, _animate: IAnimate): void {
        switch (type) {
            case AnimateEvent.COMPLETED:
                if (this.completed) this.emitType(type)
                break
            case AnimateEvent.UPDATE:
                this.emitType(type)
        }
    }

    protected each(func: IFunction): void {
        this.list.forEach(func)
    }

    public override destroy(complete?: boolean): void {
        const { list } = this
        if (list.length) {
            this.each(item => item.destroy(complete))
            list.length = 0
        }
    }

}