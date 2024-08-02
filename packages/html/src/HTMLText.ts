import { IString, IImage } from '@leafer-ui/interface'
import { Image, boundsType, registerUI, dataProcessor } from '@leafer-ui/draw'

import { IHTMLTextData, IHTMLTextInputData } from '@leafer-in/interface'

import { HTMLTextData } from './data/HTMLTextData'


@registerUI()
export class HTMLText extends Image implements IImage {

    public get __tag() { return 'HTMLText' }

    @dataProcessor(HTMLTextData)
    declare public __: IHTMLTextData

    @boundsType('')
    public text?: IString

    public get editInner(): string { return 'TextEditor' }

    constructor(data?: IHTMLTextInputData) {
        super(data)
    }

    public __updateBoxBounds(): void {

        const data = this.__

        if (data.__htmlChanged) {

            const div = document.createElement('div')
            const { style } = div

            style.all = 'initial'
            style.position = 'absolute'
            style.visibility = 'hidden'
            div.innerHTML = this.text
            document.body.appendChild(div)

            const { width, height } = div.getBoundingClientRect()
            const realWidth = width + 10 // add italic width

            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${realWidth}" height="${height}">
                        <foreignObject width="${realWidth}" height="${height}">
                            <style>
                                * {
                                    margin: 0;
                                    padding: 0;
                                    box-sizing: border-box;
                                }
                            </style>
                            <body xmlns="http://www.w3.org/1999/xhtml">
                                ${this.text}
                            </body>
                        </foreignObject>
                    </svg>`

            data.__setImageFill('data:image/svg+xml,' + encodeURIComponent(svg))

            data.__naturalWidth = realWidth / data.pixelRatio
            data.__naturalHeight = height / data.pixelRatio

            data.__htmlChanged = false

            div.remove()
        }

        super.__updateBoxBounds()
    }

}