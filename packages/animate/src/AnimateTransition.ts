import { IObject, IFourNumber } from '@leafer-ui/interface'
import { MathHelper } from '@leafer-ui/draw'
import { AnimatePaint } from './AnimatePaint'
import { numberTransition } from './transition'

const { fourNumber } = MathHelper


export const AnimateTransition: IObject = {

    fill: AnimatePaint.paintTransition,

    stroke: AnimatePaint.paintTransition,

    cornerRadius(from: IFourNumber, to: IFourNumber, t: number): IFourNumber {
        if (typeof from === 'number' && typeof to === 'number') return numberTransition(from, to, t)
        from = fourNumber(from), to = fourNumber(to)
        return from.map((f, i) => numberTransition(f, to[i], t))
    }

}