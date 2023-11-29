import { IUI, IRectInputData } from '@leafer-ui/interface'

export interface IStroker extends IUI {
    target: IUI | IUI[]
    setTarget(target: IUI | IUI[], style: IRectInputData): void
}