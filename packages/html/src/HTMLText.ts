import { IString, IImage, ILeaferCanvas, IRenderOptions, IObject } from '@leafer-ui/interface'
import { Image, boundsType, registerUI, dataProcessor, surfaceType, dataType, isString } from '@leafer-ui/draw'

import { IHTMLTextData, IHTMLTextInputData } from '@leafer-in/interface'

import { HTMLTextData } from './data/HTMLTextData'
import { unicodeEntities } from './entities/lite'


@registerUI()
export class HTMLText extends Image implements IImage {

    public get __tag() { return 'HTMLText' }

    @dataProcessor(HTMLTextData)
    declare public __: IHTMLTextData

    @boundsType('')
    public text?: IString

    @dataType('TextEditor')
    declare public editInner: string

    @surfaceType(false)
    public textEditing: boolean

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
                                ${this.decodeText(this.text)}
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

    override __draw(canvas: ILeaferCanvas, options: IRenderOptions, originCanvas?: ILeaferCanvas): void {
        if (this.textEditing && !options.exporting) return
        super.__draw(canvas, options, originCanvas)
    }

    // svg无法直接显示html实体字符，解码为unicode
    public decodeText(text: string): string {
        if (!text.includes('&')) return text

        let result = '', i = 0, entity: string, value: string
        while (i < text.length) {
            if (text[i] === '&') {
                const semicolonIndex = text.indexOf(';', i + 1)
                if (semicolonIndex > i + 1) {
                    entity = text.slice(i + 1, semicolonIndex)
                    value = unicodeEntities[entity]
                    if (value !== undefined) {
                        result += value
                        i = semicolonIndex + 1
                        continue
                    }
                }
            }
            result += text[i++]
        }

        return result
    }

    static addUnicodeEntity(entity: string | IObject, unicode?: string): void {
        if (isString(entity)) unicodeEntities[entity] = unicode
        else Object.assign(unicodeEntities, entity)
    }
}