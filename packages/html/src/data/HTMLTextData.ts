import { IString } from '@leafer-ui/interface'
import { ImageData } from '@leafer-ui/draw'

import { IHTMLTextData } from '@leafer-in/interface'


export class HTMLTextData extends ImageData implements IHTMLTextData {

    _text: string
    __htmlChanged: boolean

    setText(value: IString): void {
        this._text = value
        this.__htmlChanged = true
    }
}