import { IFourNumber, IColor, ITransitionMap, IShadowEffect, ITransitionModule, IFunction, IObject } from '@leafer-ui/interface'
import { MathHelper, ColorConvert, Transition, isArray, isString, isNumber } from '@leafer-ui/draw'


const { round } = Math
const { fourNumber } = MathHelper

export const TransitionList: ITransitionMap = {
    fill: paint,
    stroke: paint,

    cornerRadius(from: IFourNumber, to: IFourNumber, t: number): IFourNumber {
        if (isNumber(from) && isNumber(to)) return number(from, to, t)
        from = fourNumber(from), to = fourNumber(to)
        return from.map((f, i) => number(f, to[i], t))
    },

    text(from: any, to: any, t: number): any {
        if (isString(from) && isString(to)) {
            const fl = from.length, tl = to.length, len = number(fl, tl, t, 1)
            return fl < tl ? to.substring(0, len) : from.substring(0, len) //  // 打字机 与 删除文字效果
        }
        return (isNumber(from) || isNumber(to)) ? MathHelper.float(number(from, to, t), Math.max(getDecimalLen(from), getDecimalLen(to))) : to  // count 数字文字效果
    },

    boxStyle(from: any, to: any, t: number, target: any): any {
        from || (from = {}), to || (to = {})
        const betweenStyle = { ...from, ...to }
        Transition.setBetweenStyle(betweenStyle, from, to, betweenStyle, t, target)
        return betweenStyle
    },

    shadow,
    innerShadow: shadow
}


export const TransitionModule = {
    value,
    number,
    color,
    setBetweenStyle: setBetweenStyle
} as ITransitionModule

function setBetweenStyle(betweenStyle: IObject, fromStyle: IObject, toStyle: IObject, bothStyle: IObject, t: number, target: any, attrs?: IObject): void {
    let from: number, to: number, transitionAttr: IFunction
    const { list, value } = Transition

    for (let key in bothStyle) {
        if (attrs && !attrs[key]) continue
        from = fromStyle[key], to = toStyle[key], transitionAttr = list[key] || value
        if (from !== to) betweenStyle[key] = transitionAttr(from, to, t, target)
    }
}

function getDecimalLen(num: number | string) { // 小数位长度
    const decimal = String(num).split('.')[1]
    return decimal ? decimal.length : 0
}

function value(from: any, to: any, t: number): any {
    const fromIsNumber = isNumber(from), toIsNumber = isNumber(to)
    return (fromIsNumber && toIsNumber) ? from + (to - from) * t : ((toIsNumber || fromIsNumber) ? number(from, to, t) : from)
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
    return (isString(from) && isString(to)) ? color(from, to, t) : to
}


function shadow(from: IShadowEffect, to: IShadowEffect, t: number): IShadowEffect {
    if (isArray(from) || isArray(to)) return to
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