import { IColor, IObject, IRGBA } from '@leafer-ui/interface'
import { isObject, isString, isUndefined } from '@leafer-ui/draw'

import { colorNames } from './colors'


const rgbMatch = /^rgb\((\d+),\s*(\d+),\s*(\d+)/i
const rgbaMatch = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d*\.?\d+)/i

const hslMatch = /^hsl\((\d+),\s*(\d+)%\s*,\s*(\d+)%/i
const hslaMatch = /^hsla\((\d+),\s*(\d+)%\s*,\s*(\d+)%\s*,\s*(\d*\.?\d+)/i

const int = parseInt, float = parseFloat, { round } = Math


let cache: IObject = {}, totalCache = 0

export function colorToRGBA(color: IColor, opacity?: number): IRGBA {

    let RGBA: IRGBA
    let useOpacity = !isUndefined(opacity) && opacity < 1

    if (isString(color)) {

        const cacheColor = cache[color]

        if (cacheColor) {

            RGBA = { ...cacheColor }

        } else {

            switch (color[0]) {
                case '#':
                    RGBA = hexToRGBA(color)
                    break
                case 'R':
                case 'r':
                    if (color[4] === '(' && rgbaMatch.test(color)) RGBA = rgbaToRGBA(color)
                    else if (color[3] === '(' && rgbMatch.test(color)) RGBA = rgbToRGBA(color)
                    break
                case 'H':
                case 'h':
                    if (color[4] === '(' && hslaMatch.test(color)) RGBA = hslaToRGBA(color)
                    else if (color[3] === '(' && hslMatch.test(color)) RGBA = hslToRGBA(color)
                    break
            }

            if (!RGBA) {
                const value = colorNames[color.toLowerCase()]
                if (value) RGBA = hexToRGBA('#' + value)
            }

            if (RGBA) {
                totalCache++
                if (totalCache > 10000) cache = {}, totalCache = 0
                cache[color] = { ...RGBA }
            }
        }

    } else if (isObject(color)) {

        if (isUndefined(color.a)) color.a = 1
        if (useOpacity) color = { ...color }

        RGBA = color as IRGBA

    }

    if (!RGBA) RGBA = { r: 255, g: 255, b: 255, a: 1 }
    if (useOpacity) RGBA.a *= opacity

    return RGBA
}


function hexToRGBA(color: string): IRGBA {
    let r, g, b, a = 1
    switch (color.length) {
        case 9: // #FF0000FF
            r = int(color.slice(1, 3), 16)
            g = int(color.slice(3, 5), 16)
            b = int(color.slice(5, 7), 16)
            a = int(color.slice(7, 9), 16) / 255
            break
        case 7: // #FF0000
            r = int(color.slice(1, 3), 16)
            g = int(color.slice(3, 5), 16)
            b = int(color.slice(5, 7), 16)
            break
        case 5: // #F00F => #FF0000FF
            r = int(color[1] + color[1], 16)
            g = int(color[2] + color[2], 16)
            b = int(color[3] + color[3], 16)
            a = int(color[4] + color[4], 16) / 255
            break
        case 4: // #F00 => #FF0000
            r = int(color[1] + color[1], 16)
            g = int(color[2] + color[2], 16)
            b = int(color[3] + color[3], 16)
            break
        case 3: // #F0 => #F0F0F0 非标准
            r = g = b = int(color[1] + color[2], 16)
            break
        case 2: // #F => #FFFFFF 非标准
            r = g = b = int(color[1] + color[1], 16)
            break
    }

    return { r, g, b, a }
}


function rgbToRGBA(color: string): IRGBA {
    const match = rgbMatch.exec(color) // rgb(255, 255, 255)
    return {
        r: int(match[1]),
        g: int(match[2]),
        b: int(match[3]),
        a: 1
    }
}

function rgbaToRGBA(color: string): IRGBA {
    const match = rgbaMatch.exec(color) // rgba(255, 255, 255, 1)
    return {
        r: int(match[1]),
        g: int(match[2]),
        b: int(match[3]),
        a: float(match[4])
    }
}


function hslToRGBA(color: string): IRGBA {
    const match = hslMatch.exec(color) // hsl(360,100%, 100%)
    return hsla(float(match[1]), float(match[2]), float(match[3]), 1)
}

function hslaToRGBA(color: string): IRGBA {
    const match = hslaMatch.exec(color) // hsl(360,100%, 100%, 1)
    return hsla(float(match[1]), float(match[2]), float(match[3]), float(match[4]))
}


const n1 = 1 / 6, n2 = 0.5, n3 = 2 / 3, n4 = 1 / 3

function hue(p: number, q: number, t: number) {
    if (t < 0) t++
    else if (t > 1) t--
    if (t < n1) return p + (q - p) * 6 * t
    if (t < n2) return q
    if (t < n3) return p + (q - p) * (n3 - t) * 6
    return p
}

function hsla(h: number, s: number, l: number, a = 1): IRGBA {
    let r, g, b
    h /= 360, s /= 100, l /= 100
    if (s === 0) {
        r = g = b = l
    } else {
        let q = l < 0.5 ? l * (1 + s) : l + s - l * s
        let p = 2 * l - q
        r = hue(p, q, h + n4)
        g = hue(p, q, h)
        b = hue(p, q, h - n4)
    }
    return { r: round(r * 255), g: round(g * 255), b: round(b * 255), a }
}