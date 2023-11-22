import { IGroup, IRectInputData, IBoundsData } from '@leafer-ui/interface'

export interface ISelectArea extends IGroup {
    setStyle(style: IRectInputData, userStyle?: IRectInputData): void
    setBounds(bounds: IBoundsData): void
}