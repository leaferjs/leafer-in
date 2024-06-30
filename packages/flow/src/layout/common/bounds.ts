import { IBoundsData, IBoundsType, IUI } from '@leafer-ui/interface'

export function getItemBounds(child: IUI, itemBox: IBoundsType): IBoundsData {
    return itemBox === 'box' ? child.__local : child.__layout.localStrokeBounds

}