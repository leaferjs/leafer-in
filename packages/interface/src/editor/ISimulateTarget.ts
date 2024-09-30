import { IFunction, IRect, IMatrix } from '@leafer-ui/interface'

export interface ISimulateElement extends IRect {
    checkChange: boolean
    canChange: boolean
    changedTransform: IMatrix // 直接修改属性得到的变化
    safeChange(fn: IFunction): void
}