import { IBoxInputData, IFourNumber, IGroup } from '@leafer-ui/interface'

export interface IScrollBarConfig {
    padding?: IFourNumber
    theme?: IScrollBarTheme
}

export type IScrollBarTheme = 'black' | 'white' | IBoxInputData

export interface IScrollBar extends IGroup {
    config: IScrollBarConfig
    changeTheme(theme: IScrollBarTheme): void
    update(check: boolean): void
}