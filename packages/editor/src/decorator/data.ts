import { IFunction, ILeaf, IObject } from '@leafer-ui/interface'
import { defineKey } from '@leafer-ui/draw'


export function targetAttr(fn: IFunction) {
    return (target: ILeaf, key: string) => {
        const privateKey = '_' + key
        defineKey(target, key, {
            get() { return (this as IObject)[privateKey] },
            set(value: unknown) {
                const old = (this as IObject)[privateKey]
                if (old !== value) (this as IObject)[privateKey] = value, fn(this, old)
            }
        } as ThisType<ILeaf>)
    }
}