import { IBoxInputData, IFourNumber, IGroup } from '@leafer-ui/interface'

export interface IScrollBarConfig {
    theme?: IScrollBarTheme
    padding?: IFourNumber
    minSize?: number
}

export type IScrollBarTheme = 'light' | 'dark' | IBoxInputData

export interface IScrollBar extends IGroup {
    config: IScrollBarConfig
    changeTheme(theme: IScrollBarTheme): void
    update(check: boolean): void
}