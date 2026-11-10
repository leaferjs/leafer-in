import { IImageInputData, IImageData, IUIData, IUIInputData } from '@leafer-ui/interface'


interface IHTMLAttrData {
    renderType?: 'overlay' | 'canvas'
}

export interface IHTMLData extends IHTMLAttrData, IUIData { }
export interface IHTMLInputData extends IHTMLAttrData, IUIInputData { }

interface IHTMLTextAttrData {
    text?: string
    __htmlChanged?: boolean
}

export interface IHTMLTextData extends IHTMLTextAttrData, IImageData { }
export interface IHTMLTextInputData extends IHTMLTextAttrData, IImageInputData { }

