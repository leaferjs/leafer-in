import { IAnimateEasing, IAnimateEasingFunction, INumberMap, IObject } from '@leafer-ui/interface'


const { cos, sin, pow, sqrt, abs, PI } = Math

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

        let y = t
        for (let i = 0; i < 8; i++) { // 循环次数可调
            const x = bezier(y, x1, x2) - t
            const dx = 3 * (1 - y) ** 2 * x1 + 6 * (1 - y) * y * (x2 - x1) + 3 * y ** 2 * (1 - x2)
            if (abs(dx) < 1e-6) break // 精度可调
            y -= x / dx
        }

        return cache[key] = bezier(y, y1, y2)
    }
}

function bezier(t: number, v1: number, v2: number): number {
    const o = 1 - t
    return (3 * o ** 2 * t) * v1 + (3 * o * t ** 2) * v2 + t ** 3
}


export const AnimateEasing = {

    get(easing: IAnimateEasing) {
        const { list } = AnimateEasing
        if (typeof easing === 'string') return list[easing]
        else if (easing instanceof Array) return cubicBezier(easing[0], easing[1], easing[2], easing[3])
        else return list['ease']
    },

    register(name: string, value: IAnimateEasingFunction): void {
        (AnimateEasing.list as IObject)[name] = value
    },

    cubicBezier,

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
        'bounce-in-out': (t: number) => t < 0.5 ? (1 - bounceOut(1 - t * 2)) * 0.5 : (1 + bounceOut(t * 2 - 1)) * 0.5
    }

}