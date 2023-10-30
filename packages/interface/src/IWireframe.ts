import { IUI, IRectInputData } from '@leafer-ui/interface'

export interface IWireframe extends IUI {
    target: IUI | IUI[]
    setTarget(target: IUI | IUI[], style: IRectInputData): void
}