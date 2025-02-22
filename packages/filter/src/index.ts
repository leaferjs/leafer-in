import { IFilter, IFilterModule, IFilterProcessor, IUI, IMatrixWithBoundsScaleData, ILeaferCanvas, ICachedShape } from '@leafer-ui/interface'
import { Plugin, Filter } from '@leafer-ui/draw'


Plugin.add('filter')


Object.assign(Filter, {
    list: {},
    register(name: string, filterProcessor: IFilterProcessor): void {
        Filter.list[name] = filterProcessor
    },
    apply(filters: IFilter[], ui: IUI, bounds: IMatrixWithBoundsScaleData, currentCanvas: ILeaferCanvas, originCanvas: ILeaferCanvas, shape: ICachedShape): void {
        let item: IFilterProcessor
        filters.forEach(filter => {
            item = Filter.list[filter.type]
            if (item) item.apply(filter, ui, bounds, currentCanvas, originCanvas, shape)
        })
    },
    getSpread(filters: IFilter[]) {
        let item: IFilterProcessor, width = 0
        filters.forEach(filter => {
            item = Filter.list[filter.type]
            if (item) width += item.getSpread(filter)
        })
        return width
    }
} as IFilterModule)
