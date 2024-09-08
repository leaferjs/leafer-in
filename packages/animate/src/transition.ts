const { round } = Math

export function transition(from: number, to: number, t: number): any {
    return (typeof from === 'number' && typeof to === 'number') ? from + (to - from) * t : to
}

export function numberTransition(from: number, to: number, t: number, roundValue?: number): number {
    const value = from + (to - from) * t
    return roundValue ? round(value) : value
}