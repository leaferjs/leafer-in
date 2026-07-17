import { IFunction, ILeaf, IObject, IUI, } from '@leafer-ui/interface'
import { defineKey, isNull, isArray, isObject, isUndefined, DataHelper } from '@leafer-ui/draw'

import { IEditor, IInnerEditor } from '@leafer-in/interface'

import { EditorEvent } from '../event/EditorEvent'
import { EditorHelper } from '../helper/EditorHelper'


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

                            if (t.hasDimOthers) t.cancelDimOthers()

                            if (isArray(value) && value.length > 1 && value.some(item => item.locked || item.editable === 'single')) {
                                value = value.filter(item => !(item.locked || item.editable === 'single')) // 锁定、单选元素不能参与多选
                            }

                            if (t.single) {
                                delete t.element.syncEventer // 重置 EditBox.load() 同步事件设置
                                delete t.element.__world.ignorePixelSnap // 重置 EditBox.load() 忽略对齐像素设置
                            }
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
                const { config, element, dragPoint, editBox, editTool, innerEditor, app } = this, mergeConfig = { ...config } // 实时合并，后期可优化

                if (innerEditor) innerEditor.editConfig && Object.assign(mergeConfig, innerEditor.editConfig) // innerEditor 上的配置
                else if (editTool) editTool.editConfig && Object.assign(mergeConfig, editTool.editConfig) // editTool 上的配置

                if (element && element.mask) EditorHelper.mergeMaskConfig(mergeConfig, this) // 扩展

                if (element && element.editConfig) {
                    let { editConfig } = element
                    if (editConfig.hover || editConfig.hoverStyle || editConfig.hoverPathType) { // 元素的hover样式，不能覆盖到总配置里
                        editConfig = { ...editConfig }
                        delete editConfig.hover
                        delete editConfig.hoverStyle
                        delete editConfig.hoverPathType
                    }
                    Object.assign(mergeConfig, editConfig) // 元素上的配置
                }
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



// 合并编辑工具配置装饰器
export function editToolMergeConfigAttr() {
    return (target: IInnerEditor, key: string) => {
        defineKey(target, key, {
            get() {
                const t = this as IInnerEditor
                const { config, userConfig, configKeepKeys } = t, mergedConfig: IObject = config ? DataHelper.clone(config) : {}

                if (configKeepKeys) {
                    for (let key in userConfig) {
                        if (!configKeepKeys.includes(key)) mergedConfig[key] = userConfig[key] // 不直接覆盖 configKeepKeys
                    }
                }

                if (t.preMergedConfig) t.preMergedConfig(mergedConfig)

                if (configKeepKeys) configKeepKeys.forEach(key => { userConfig[key] && Object.assign(mergedConfig[key], userConfig[key]) }) // 单独 assign configKeepKeys

                return t.mergedConfig = mergedConfig
            }
        } as ThisType<any>)
    }
}

