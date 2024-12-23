import { IUI, IRectInputData } from '@leafer-ui/interface'

export interface IStroker extends IUI {
    target: IUI | IUI[]
    update(): void
    setTarget(target: IUI | IUI[], style: IRectInputData): void
}