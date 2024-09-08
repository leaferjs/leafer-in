import { IColor, IPaint, IPaintString } from '@leafer-ui/interface'
import { ColorConvert } from '@leafer-ui/draw'
import { numberTransition } from './transition'


export function paintTransition(from: IPaint | IPaintString, to: IPaint | IPaint[] | IPaintString, t: number) {
    if (typeof from === 'string' && typeof to === 'string') {
        return AnimatePaint.color(from, to, t)
    } else if (from === 'object' && typeof to === 'object') {
        return to
    } else {
        return to
    }
}

export const AnimatePaint = {

    color(from: IColor, to: IColor, t: number): string {
        from = ColorConvert.object(from), to = ColorConvert.object(to)
        const a = numberTransition(from.a, to.a, t)
        const rgb = numberTransition(from.r, to.r, t, 1) + ',' + numberTransition(from.g, to.g, t, 1) + ',' + numberTransition(from.b, to.b, t, 1)
        return a === 1 ? 'rgb(' + rgb + ')' : 'rgba(' + rgb + ',' + a + ')'
    }

}