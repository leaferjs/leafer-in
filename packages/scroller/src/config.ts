import { IScrollConfig } from '@leafer-ui/interface'


export const config: IScrollConfig = {
    theme: 'light',
    style: { dragBoundsType: 'outer', strokeAlign: 'center', strokeWidthFixed: 'zoom-in', width: 6, height: 6, opacity: 0.5, cornerRadius: 3, hoverStyle: { opacity: 0.6 }, pressStyle: { opacity: 0.66 } },
    size: 6,
    endsMargin: 2,
    sideMargin: 2,
    minSize: 10,
    scaleFixed: 'zoom-in',
    scrollType: 'both',
    hideOnActionEnd: 'hover'
}

