import { IImageInputData, IImageData } from '@leafer-ui/interface'

interface IHTMLTextAttrData {
    text?: string
    __htmlChanged?: boolean
}

export interface IHTMLTextData extends IHTMLTextAttrData, IImageData { }
export interface IHTMLTextInputData extends IHTMLTextAttrData, IImageInputData { }