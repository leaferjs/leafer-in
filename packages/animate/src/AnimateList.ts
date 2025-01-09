import { IAnimate, IUIInputData, IObject, IUI, IPercentData, IAnimation } from '@leafer-ui/interface'
import { useModule, LeafEventer } from '@leafer-ui/draw'

import { Animate } from './Animate'


@useModule(LeafEventer)
export class AnimateList extends Animate {

    public target: IUI | IObject

    public list: IAnimate[]

    constructor(target: IUI | IObject, animation?: IAnimation[], isTemp?: boolean) {
        super(null, null)
        this.fromStyle = {}
        this.toStyle = {}
        this.list = animation.map(item => {
            const animate = new Animate(target, item, isTemp)
            Object.assign(this.fromStyle, animate.fromStyle)
            Object.assign(this.toStyle, animate.toStyle)
            return animate
        })
    }

    public override play(): void {
        this.list.forEach(item => item.play())
    }

    public override pause(): void {
        this.list.forEach(item => item.pause())
    }

    public override stop(): void {
        this.list.forEach(item => item.stop())
    }

    public override seek(time: number | IPercentData): void {
        this.list.forEach(item => item.seek(time))
    }

    public override kill(complete?: boolean, killStyle?: IUIInputData): void {
        this.list.forEach(item => item.kill(complete, killStyle))
        this.destroy()
    }

    public override destroy(complete?: boolean): void {
        const { list } = this
        if (list.length) {
            list.forEach(item => item.destroy(complete))
            list.length = 0
        }
    }

}