import { ColorConvert, isArray } from '@leafer-ui/core'
import { IFill, IText, IRGB, ITextDecorationType } from '@leafer-ui/interface'


export const textCaseMap = {
    'none': 'none',
    'title': 'capitalize',
    'upper': 'uppercase',
    'lower': 'lowercase',
    'small-caps': 'small-caps'
}

export const verticalAlignMap = {
    'top': 'flex-start',
    'middle': 'center',
    'bottom': 'flex-end'
}

export const textDecorationMap = {
    'none': 'none',
    'under': 'underline',
    'delete': 'line-through',
    'under-delete': 'underline line-through'
}

export function updateStyle(textDom: HTMLDivElement, text: IText, textScale: number): void {
    const { style } = textDom
    const { fill, padding, textWrap, textOverflow, textDecoration } = text

    style.fontFamily = text.fontFamily
    style.fontSize = text.fontSize * textScale + 'px'
    setFill(style, fill)

    style.fontStyle = text.italic ? 'italic' : 'normal'
    style.fontWeight = text.fontWeight as string

    let decorationType: ITextDecorationType
    if (typeof textDecoration === 'object') {
        decorationType = textDecoration.type
        if (textDecoration.color) style.textDecorationColor = ColorConvert.string(textDecoration.color)
    } else {
        decorationType = textDecoration
    }
    style.textDecoration = textDecorationMap[decorationType]

    style.textTransform = textCaseMap[text.textCase]

    style.textAlign = text.textAlign === 'both' ? 'justify' : text.textAlign
    style.display = 'flex'
    style.flexDirection = 'column'
    style.justifyContent = verticalAlignMap[text.verticalAlign]

    style.lineHeight = (text.__.__lineHeight || 0) * textScale + 'px'
    style.letterSpacing = (text.__.__letterSpacing || 0) * textScale + 'px'

    style.whiteSpace = (textWrap === 'none' || text.__.__autoWidth) ? 'nowrap' : 'normal'
    style.wordBreak = textWrap === 'break' ? 'break-all' : 'normal'

    style.textIndent = (text.paraIndent || 0) * textScale + 'px'
    style.padding = isArray(padding) ? padding.map(item => item * textScale + 'px').join(' ') : (padding || 0) * textScale + 'px'
    style.textOverflow = textOverflow === 'show' ? '' : (textOverflow === 'hide' ? 'clip' : textOverflow)

}

function setFill(style: CSSStyleDeclaration, fill: IFill): void {
    let color: string = 'black'

    if (isArray(fill)) fill = fill[0]

    if (typeof fill === 'object') {

        switch (fill.type) {
            case 'solid':
                color = ColorConvert.string(fill.color)
                break
            case 'image':
                break
            case 'linear':
            case 'radial':
            case 'angular':
                const stop = fill.stops[0]
                color = ColorConvert.string(typeof stop === 'string' ? stop : stop.color)
                break
            default:
                if ((fill as IRGB).r !== undefined) color = ColorConvert.string(fill)
        }

    } else {
        color = fill
    }

    style.color = color
}