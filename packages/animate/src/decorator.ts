import { IAnimate, IObject } from '@leafer-ui/interface'


export function animateAttr(defaultValue?: any) {
    return (target: IAnimate, key: string) => {
        Object.defineProperty(target, key, {
            get() {
                const value = (this.config as IObject)[key]
                return value === undefined ? defaultValue : value
            },
            set(value: unknown) { (this.config as IObject)[key] = value }
        } as ThisType<IAnimate>)
    }
}

