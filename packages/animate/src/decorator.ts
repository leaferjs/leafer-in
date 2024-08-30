import { IAnimate, IAnimateOptions, IObject } from '@leafer-ui/interface'


export function animateAttr(defaultValue?: any) {
    return (target: IAnimate, key: string) => {
        Object.defineProperty(target, key, {
            get() {
                const value = this.config && (this.config as IObject)[key]
                return value === undefined ? defaultValue : value
            },
            set(value: unknown) {
                if (!this.config) this.config = {} as IAnimateOptions
                (this.config as IObject)[key] = value
            }
        } as ThisType<IAnimate>)
    }
}

