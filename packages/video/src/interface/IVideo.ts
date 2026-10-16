import { IBox, IBoxData, IBoxInputData } from '@leafer-ui/interface' // IVideo, IVideoData, IVideoInputData,

// VideoBox
export interface IVideoBox extends IVideoAttrData, IBox {
    __: IVideoBoxData
}
export interface IVideoBoxData extends IVideoAttrData, IBoxData { }
export interface IVideoBoxInputData extends IVideoAttrData, IBoxInputData { }

interface IVideoAttrData {
    url?: string
}