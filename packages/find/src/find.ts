
import { IFindMethod, ISelector, IFindUIMethod, IUI } from '@leafer-ui/interface'
import { UI, Creator, Platform } from '@leafer-ui/draw'


const ui = UI.prototype

function getSelector(ui: IUI): ISelector {
    return ui.leafer ? ui.leafer.selector : (Platform.selector || (Platform.selector = Creator.selector()))
}

ui.find = function (condition: number | string | IFindUIMethod, options?: any): IUI[] {
    return getSelector(this).getBy(condition as IFindMethod, this, false, options) as IUI[]
}

ui.findOne = function (condition: number | string | IFindUIMethod, options?: any): IUI | undefined {
    return getSelector(this).getBy(condition as IFindMethod, this, true, options) as IUI
}