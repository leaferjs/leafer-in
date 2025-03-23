import { IFunction, ILeaf, IObject, IUI, } from '@leafer-ui/interface'
import { IEditor } from '@leafer-in/interface'
import { defineKey } from '@leafer-ui/draw'

import { EditorEvent } from '../event/EditorEvent'



export function targetAttr(fn: IFunction) {
    return (target: ILeaf, key: string) => {
        const privateKey = '_' + key
        defineKey(target, key, {
            get() { return (this as IObject)[privateKey] },
            set(value: unknown) {
                const old = (this as IObject)[privateKey]
                if (old !== value) {
                    const type = key === 'target' ? EditorEvent.BEFORE_SELECT : EditorEvent.BEFORE_HOVER
                    if (this.hasEvent(type)) this.emitEvent(new EditorEvent(type, { editor: this as IEditor, value: value as IUI, oldValue: old }));
                    (this as IObject)[privateKey] = value, fn(this, old)
                }
            }
        } as ThisType<ILeaf>)
    }
}