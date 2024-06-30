import { IBoundsData, IGap, IFlowAlign, IAxisAlign, IFlowWrap } from '@leafer-ui/interface'

export interface IFlowWrapDrawData extends IGapBoundsData {
    list: IFlowDrawData[]
}

export interface IFlowDrawData extends IGapBoundsData {
    start: number
    grow: number
    hasRangeSize?: boolean
}

export interface IGapBoundsData extends IBoundsData {
    count: number
    gap: number
}

export interface IFlowAlignToAxisAlignMap {
    [name: string]: IAxisAlign
}

export interface IFlowParseData {
    complex: boolean
    wrap: IFlowWrap

    xGap: IGap
    yGap: IGap
    isAutoXGap: boolean
    isAutoYGap: boolean
    isFitXGap: boolean
    isFitYGap: boolean

    contentAlign: IFlowAlign
    rowXAlign: IAxisAlign
    rowYAlign: IAxisAlign
}