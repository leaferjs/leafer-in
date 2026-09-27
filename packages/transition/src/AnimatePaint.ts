import { IPaint, IPaintString, IGradientPaint, IUI, IUnitPointData, IAlign, IGradientType, IColorStop, IColorString } from '@leafer-ui/interface'
import { AroundHelper, Transition, isObject, isString } from '@leafer-ui/draw'


export const AnimatePaint = {

    paintTransition(from: IPaint | IPaint[] | IPaintString, to: IPaint | IPaint[] | IPaintString, t: number, ui: IUI) {
        if (isString(from) && isString(to)) {
            return Transition.color(from, to, t)
        } else if (isObject(from) && isObject(to)) {
            return AnimatePaint.gradient(from as any, to as any, t, ui)
        } else {
            return to
        }
    },

    gradient(from: IGradientPaint, to: IGradientPaint, t: number, ui: IUI): IGradientPaint {
        const paint: IGradientPaint = { ...to }
        paint.from = gradientPoint('from', from, to, t, ui)
        paint.to = gradientPoint('to', from, to, t, ui)
        paint.stops = AnimatePaint.stops(from.stops, to.stops, t)
        if (from.opacity || to.opacity) paint.opacity = Transition.number(from.opacity || 1, to.opacity || 1, t)
        if (from.rotation || to.rotation) paint.rotation = Transition.number(from.rotation || 0, to.rotation || 0, t)
        if (from.stretch || to.stretch) paint.stretch = Transition.number(from.stretch || 1, to.stretch || 1, t)
        return paint
    },

    stops(from: IColorStop[] | IColorString[], to: IColorStop[] | IColorString[], t: number): IColorStop[] | IColorString[] {
        const fromStr = isString(from[0]), toStr = isString(to[0])
        if (from.length === to.length && fromStr && toStr) return from.map((color, index) => Transition.color(color as string, to[index] as string, t))

        if (fromStr) from = toStops(from as IColorString[])
        if (toStr) to = toStops(to as IColorString[])

        if (from.length < to.length) from = fixStops(from as IColorStop[], to.length)
        else if (to.length < from.length) to = fixStops(to as IColorStop[], from.length)

        return from.map((stop, index) => {
            return {
                offset: Transition.number((stop as IColorStop).offset, (to[index] as IColorStop).offset, t),
                color: Transition.color((stop as IColorStop).color, (to[index] as IColorStop).color, t)
            }
        })
    }

}


function fixStops(stops: IColorStop[], len: number): IColorStop[] {
    const add = len - stops.length, newStops = []
    for (let i = 0; i < stops.length; i++) {
        newStops.push(stops[i])
        if (i < add) newStops.push(stops[i])
    }
    return newStops
}

function toStops(stops: IColorString[]): IColorStop[] {
    const { length } = stops
    return stops.map((color, index) => { return { offset: index / (length - 1), color } }) as IColorStop[]
}

function gradientPoint(fromTo: 'from' | 'to', a: IGradientPaint, b: IGradientPaint, t: number, ui: IUI): IUnitPointData | IAlign {
    if (a[fromTo] === b[fromTo]) return a[fromTo]

    let from = toGradientPoint(a.type, fromTo, a[fromTo])
    let to = toGradientPoint(b.type, fromTo, b[fromTo])

    if (from.type !== to.type) {
        const { boxBounds } = ui.__layout
        if (from.type !== 'px') from = { ...from, type: 'px' }, AroundHelper.toPoint(from, boxBounds, from)
        if (to.type !== 'px') to = { ...to }, AroundHelper.toPoint(to, boxBounds, to)
    }

    return {
        type: from.type,
        x: Transition.number(from.x, to.x, t),
        y: Transition.number(from.y, to.y, t)
    }
}

function toGradientPoint(type: IGradientType, fromTo: 'from' | 'to', point: IUnitPointData | IAlign): IUnitPointData {
    if (!point) point = type === 'linear' ? (fromTo === 'from' ? 'top' : 'bottom') : (fromTo === 'from' ? 'center' : 'bottom')
    return isObject(point) ? point : AroundHelper.get(point)
}