import { IFunction, ILeaf, IObject, IUI, } from '@leafer-ui/interface'
import { defineKey, isNull, isArray, isObject, isUndefined } from '@leafer-ui/draw'

import { IEditor } from '@leafer-in/interface'

import { EditorEvent } from '../event/EditorEvent'


export function targetAttr(fn: IFunction) {
    return (target: ILeaf, key: string) => {
        const privateKey = '_' + key
        defineKey(target, key, {
            get() { return (this as IObject)[privateKey] },
            set(value: IUI | IUI[]) {
                const old = (this as IObject)[privateKey]
                if (old !== value) {

                    const t = this as IEditor

                    if (t.config) { // Editor

                        const isSelect = key === 'target'
                        if (isSelect) {
                            const { beforeSelect } = t.config
                            if (beforeSelect) {
                                const check = beforeSelect({ target: value })
                                if (isObject(check)) value = check
                                else if (check === false) return
                            }

                            t.setDimOthers(false)
                            t.setBright(false)

                            if (isArray(value) && value.length > 1 && value[0].locked) value.splice(0, 1) // fix: 单个锁定 + shift多选
                            if (t.single) t.element.syncEventer = null // 重置 EditBox.load() 设置
                        }

                        const type = isSelect ? EditorEvent.BEFORE_SELECT : EditorEvent.BEFORE_HOVER
                        if (this.hasEvent(type)) this.emitEvent(new EditorEvent(type, { editor: t, value: value as IUI, oldValue: old }))
                    }

                    (this as IObject)[privateKey] = value, fn(this, old)
                }
            }
        } as ThisType<ILeaf>)
    }
}


export function mergeConfigAttr() {
    return (target: IEditor, key: string) => {
        defineKey(target, key, {
            get() {
                const { config, element, dragPoint, editBox, app } = this, mergeConfig = { ...config } // 实时合并，后期可优化
                if (element && element.editConfig) Object.assign(mergeConfig, element.editConfig) // 元素上的配置
                if (editBox.config) Object.assign(mergeConfig, editBox.config) // EditBox 上的配置
                if (dragPoint) {
                    if (dragPoint.editConfig) Object.assign(mergeConfig, dragPoint.editConfig)
                    if (mergeConfig.editSize === 'font-size') mergeConfig.lockRatio = true // 强制锁定比例
                    if (dragPoint.pointType === 'resize-rotate') {
                        mergeConfig.around || (mergeConfig.around = 'center')
                        isNull(mergeConfig.lockRatio) && (mergeConfig.lockRatio = true)
                    }
                }
                if (isUndefined(mergeConfig.dragLimitAnimate)) mergeConfig.dragLimitAnimate = app && app.config.pointer.dragLimitAnimate
                return (this as IObject).mergedConfig = mergeConfig
            }
        } as ThisType<IEditor>)
    }
}


