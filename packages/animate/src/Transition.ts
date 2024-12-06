import { IFourNumber, IColor, ITransitionMap, IShadowEffect } from '@leafer-ui/interface'
import { MathHelper, ColorConvert } from '@leafer-ui/draw'


const { round } = Math
const { fourNumber } = MathHelper

export const TransitionList: ITransitionMap = {
    fill: paint,
    stroke: paint,

    cornerRadius(from: IFourNumber, to: IFourNumber, t: number): IFourNumber {
        if (typeof from === 'number' && typeof to === 'number') return number(from, to, t)
        from = fourNumber(from), to = fourNumber(to)
        return from.map((f, i) => number(f, to[i], t))
    },

    text(from: any, to: any, t: number): any {
        return (typeof from === 'number' || typeof to === 'number') ? Math.round(number(from, to, t)) : to // count 效果
    },

    shadow,
    innerShadow: shadow
}

export const TransitionModule = {
    value,
    number,
    color
}

function value(from: any, to: any, t: number): any {
    return (typeof from === 'number' && typeof to === 'number') ? from + (to - from) * t : to
}

function number(from: number, to: number, t: number, roundValue?: number): number {
    from || (from = 0), to || (to = 0)
    const value = from + (to - from) * t
    return roundValue ? round(value) : value
}

function color(from: IColor, to: IColor, t: number): string {
    from = ColorConvert.object(from), to = ColorConvert.object(to)
    const rgb = number(from.r, to.r, t, 1) + ',' + number(from.g, to.g, t, 1) + ',' + number(from.b, to.b, t, 1)
    const a = number(from.a, to.a, t)
    return a === 1 ? 'rgb(' + rgb + ')' : 'rgba(' + rgb + ',' + a + ')'
}

function paint(from: string, to: string, t: number): any {
    return (typeof from === 'string' && typeof to === 'string') ? color(from, to, t) : to
}


function shadow(from: IShadowEffect, to: IShadowEffect, t: number): IShadowEffect {
    if (from instanceof Array || to instanceof Array) return to
    from = from || {} as IShadowEffect, to = to || {} as IShadowEffect
    return {
        x: number(from.x, to.x, t),
        y: number(from.y, to.y, t),
        blur: number(from.blur, to.blur, t),
        spread: number(from.spread, to.spread, t),
        color: color(from.color || '#FFFFFF00', to.color || '#FFFFFF00', t),
        visible: to.visible,
        blendMode: to.blendMode,
        box: to.box || from.box
    } as IShadowEffect
}