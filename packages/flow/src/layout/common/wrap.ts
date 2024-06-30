import { IFlowWrapDrawData, IFlowDrawData } from '@leafer-in/interface'


export function flowWrap(wrapData: IFlowWrapDrawData, data: IFlowDrawData, wrapSide: 'width' | 'height'): void {
    const otherSide = wrapSide === 'width' ? 'height' : 'width'
    wrapData[wrapSide] = Math.max(wrapData[wrapSide], data[wrapSide])
    wrapData[otherSide] += wrapData.count ? data[otherSide] + wrapData.gap : data[otherSide]
    wrapData.list.push(data)
    wrapData.count++
}
