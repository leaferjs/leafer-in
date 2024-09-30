import { IFunction, IRect } from '@leafer-ui/interface'

export interface ISimulateElement extends IRect {
    checkChange: boolean
    safeChange(fn: IFunction): void
}