import { IAnimateEasing, IAnimateEasingFunction, ICustomEasingFunction, INumberMap, IObject } from '@leafer-ui/interface'
import { isArray, isObject, isString } from '@leafer-ui/draw'


const { cos, sin, pow, sqrt, abs, ceil, floor, round, PI } = Math

const PIx5 = PI * 5

const n1 = 1.70158
const n2 = 1.70158 * 1.525

const n3 = 7.5625
const n4 = 2.75


function powIn(count: number): IAnimateEasingFunction {
    return (t: number) => pow(t, count)
}

function powOut(count: number): IAnimateEasingFunction {
    return (t: number) => 1 - pow(1 - t, count)
}

function powInOut(count: number): IAnimateEasingFunction {
    return (t: number) => t < 0.5 ? pow(t * 2, count) * 0.5 : 1 - pow(2 - t * 2, count) * 0.5
}


function bounceOut(t: number): number {
    if (t < 1 / n4) return n3 * t * t
    else if (t < 2 / n4) return n3 * (t -= 1.5 / n4) * t + 0.75
    else if (t < 2.5 / n4) return n3 * (t -= 2.25 / n4) * t + 0.9375
    else return n3 * (t -= 2.625 / n4) * t + 0.984375
}


function cubicBezier(x1: number, y1: number, x2: number, y2: number): IAnimateEasingFunction {
    const cache: INumberMap = {}

    return (t: number) => {
        const key = ~~(t * 10000), c = cache[key] // 缓存精度可调
        if (c) return c

        let o: number, dx: number, x: number, v = t
        for (let i = 0; i < 8; i++) { // 循环次数可调
            o = 1 - v
            x = bezier(v, x1, x2) - t
            dx = 3 * o * o * x1 + 6 * o * v * (x2 - x1) + 3 * v * v * (1 - x2)
            if (abs(dx) < 1e-6) break // 精度可调
            v -= x / dx
        }

        return cache[key] = bezier(v, y1, y2)
    }
}

function bezier(t: number, v1: number, v2: number): number {
    const o = 1 - t
    return 3 * o * o * t * v1 + 3 * o * t * t * v2 + t * t * t
}


function steps(steps: number, intStep: 'floor' | 'round' | 'ceil' = 'floor'): IAnimateEasingFunction {
    return (t: number) => (intStep === 'floor' ? floor(t * steps) : (intStep === 'ceil' ? ceil(t * steps) : round(t * steps))) / steps
}


export const AnimateEasing = {

    get(easing: IAnimateEasing) {
        const { list } = AnimateEasing
        if (isString(easing)) return list[easing || 'ease']
        else if (isObject(easing)) return list[easing.name].apply(list, isArray(easing.value) ? easing.value : [easing.value])
        else return list['ease']
    },

    register(name: string, value: ICustomEasingFunction): void {
        AnimateEasing.list[name] = value
    },

    list: {

        'linear': (t: number) => t,

        // 缓动
        'ease': cubicBezier(0.25, 0.1, 0.25, 1),

        'ease-in': cubicBezier(0.42, 0, 1, 1),
        'ease-out': cubicBezier(0, 0, 0.58, 1),
        'ease-in-out': cubicBezier(0.42, 0, 0.58, 1),

        // 三角函数
        'sine-in': (t: number) => 1 - cos((t * PI) * 0.5),
        'sine-out': (t: number) => sin((t * PI) * 0.5),
        'sine-in-out': (t: number) => (1 - cos(t * PI)) * 0.5,

        // 二次方
        'quad-in': powIn(2),
        'quad-out': powOut(2),
        'quad-in-out': powInOut(2),

        // 三次方
        'cubic-in': powIn(3),
        'cubic-out': powOut(3),
        'cubic-in-out': powInOut(3),

        // 四次方
        'quart-in': powIn(4),
        'quart-out': powOut(4),
        'quart-in-out': powInOut(4),

        // 五次方
        'quint-in': powIn(5),
        'quint-out': powOut(5),
        'quint-in-out': powInOut(5),

        // 指数
        'expo-in': (t: number) => t ? pow(2, t * 10 - 10) : 0,
        'expo-out': (t: number) => t === 1 ? 1 : 1 - pow(2, -t * 10),
        'expo-in-out': (t: number) => (t === 0 || t === 1) ? t : (t < 0.5 ? pow(2, t * 2 * 10 - 10) * 0.5 : (2 - pow(2, 10 - t * 2 * 10)) * 0.5),

        // 平方根
        'circ-in': (t: number) => 1 - sqrt(1 - pow(t, 2)),
        'circ-out': (t: number) => sqrt(1 - pow(t - 1, 2)),
        'circ-in-out': (t: number) => t < 0.5 ? (1 - sqrt(1 - pow(t * 2, 2))) * 0.5 : (sqrt(1 - pow(2 - t * 2, 2)) + 1) * 0.5,

        // 单次回弹
        'back-in': (t: number) => ((n1 + 1) * t - n1) * t * t,
        'back-out': (t: number) => (t -= 1) * t * ((n1 + 1) * t + n1) + 1,
        'back-in-out': (t: number) => t < 0.5 ? ((t *= 2) * t * ((n2 + 1) * t - n2)) * 0.5 : ((t = t * 2 - 2) * t * ((n2 + 1) * t + n2) + 2) * 0.5,

        // 多次回弹
        'elastic-in': (t: number) => (t === 0 || t === 1) ? t : -pow(2, (t - 1) * 10) * sin((t - 1.1) * PIx5),
        'elastic-out': (t: number) => (t === 0 || t === 1) ? t : pow(2, -10 * t) * sin((t - 0.1) * PIx5) + 1,
        'elastic-in-out': (t: number) => (t === 0 || t === 1) ? t : (t < 0.5 ? -pow(2, ((t *= 2) - 1) * 10) * sin((t - 1.1) * PIx5) * 0.5 : pow(2, (1 - (t *= 2)) * 10) * sin((t - 1.1) * PIx5) * 0.5 + 1),

        // 重力反弹
        'bounce-in': (t: number) => 1 - bounceOut(1 - t),
        'bounce-out': bounceOut,
        'bounce-in-out': (t: number) => t < 0.5 ? (1 - bounceOut(1 - t * 2)) * 0.5 : (1 + bounceOut(t * 2 - 1)) * 0.5,

        // 其他函数
        'cubic-bezier': cubicBezier,
        steps

    } as IObject

}