import { IFunction, ILeaf, IObject, IUI, } from '@leafer-ui/interface'
import { IEditor } from '@leafer-in/interface'
import { defineKey } from '@leafer-ui/draw'

import { EditorEvent } from '../event/EditorEvent'


export function targetAttr(fn: IFunction) {
    return (target: ILeaf, key: string) => {
        const privateKey = '_' + key
        defineKey(target, key, {
            get() { return (this as IObject)[privateKey] },
            set(value: IUI | IUI[]) {
                const old = (this as IObject)[privateKey]
                if (old !== value) {

                    if ((this as IEditor).config) { // Editor

                        const isSelect = key === 'target'
                        if (isSelect) {
                            if (value instanceof Array && value.length > 1 && value[0].locked) value.splice(0, 1) // fix: 单个锁定 + shift多选

                            const { beforeSelect } = (this as IEditor).config
                            if (beforeSelect) {
                                const check = beforeSelect({ target: value })
                                if (typeof check === 'object') value = check
                                else if (check === false) return
                            }
                        }

                        const type = isSelect ? EditorEvent.BEFORE_SELECT : EditorEvent.BEFORE_HOVER
                        if (this.hasEvent(type)) this.emitEvent(new EditorEvent(type, { editor: this as IEditor, value: value as IUI, oldValue: old }))
                    }

                    (this as IObject)[privateKey] = value, fn(this, old)
                }
            }
        } as ThisType<ILeaf>)
    }
}