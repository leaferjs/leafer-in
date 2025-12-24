import { IUI, IUIInputData } from '@leafer-ui/interface'

export interface IStroker extends IUI {
    target: IUI | IUI[]
    update(style?: IUIInputData): void
    setTarget(target: IUI | IUI[], style?: IUIInputData): void
}