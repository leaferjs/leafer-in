import { IEditorConfig } from '@leafer-in/interface'
import { resizeSVG, rotateSVG, skewSVG } from './svg'


export const config: IEditorConfig = {
    editSize: 'size',
    keyEvent: true,

    stroke: '#836DFF',
    strokeWidth: 2,

    pointFill: '#FFFFFF',
    pointSize: 10,
    pointRadius: 16,

    rotateGap: 45,

    buttonsDirection: 'bottom',
    buttonsMargin: 12,

    hideOnSmall: true,

    moveCursor: 'move',
    resizeCursor: { url: resizeSVG, x: 12, y: 12 },
    rotateCursor: { url: rotateSVG, x: 12, y: 12 },
    skewCursor: { url: skewSVG, x: 12, y: 12 },

    selector: true,
    editBox: true,
    hover: true,
    select: 'press',
    openInner: 'double',
    boxSelect: true,

    moveable: true,
    resizeable: true,
    flipable: true,
    rotateable: true,
    skewable: true
}