import { IBoundsData } from '@leafer-ui/interface'


export function getZoomScale(scaleX: number, type: 'in' | 'out'): number {
    let scale = 1
    const out = type === 'out', absScale = Math.abs(scaleX)
    if (absScale > 1) {
        while (out ? scale < absScale : scale <= absScale) scale *= 2
        if (out) scale /= 2
    } else {
        while (out ? scale >= absScale : scale > absScale) scale /= 2
        if (!out) scale *= 2
    }
    return scale / scaleX
}

export function getFixBounds(bounds: IBoundsData, scaleBounds: IBoundsData): IBoundsData {
    let { x, y, width, height } = bounds
    let fix: boolean
    if (!height) height = width * (scaleBounds.height / scaleBounds.width), fix = true
    if (!width) width = height * (scaleBounds.width / scaleBounds.height), fix = true
    return fix ? { x, y, width, height } : bounds
}