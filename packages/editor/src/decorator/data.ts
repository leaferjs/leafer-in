import { IFunction, ILeaf, IObject } from '@leafer-ui/interface'
import { defineKey } from '@leafer-ui/core'


export function targetAttr(fn: IFunction) {
    return (target: ILeaf, key: string) => {
        const privateKey = '_' + key
        defineKey(target, key, {
            get() { return (this as IObject)[privateKey] },
            set(value: unknown) { if ((this as IObject)[privateKey] !== value) (this as IObject)[privateKey] = value, fn(this) }
        } as ThisType<ILeaf>)
    }
}