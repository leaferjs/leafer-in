import { IEditorConfig } from '@leafer-in/interface'
import { resizeSVG, rotateSVG, skewSVG } from './svg'


export const config: IEditorConfig = {
    editSize: 'auto',

    stroke: '#836DFF',
    strokeWidth: 2,

    pointFill: '#FFFFFF',
    pointSize: 10,
    pointRadius: 16,

    rotateGap: 45,

    buttonsDirection: 'bottom',
    buttonsMargin: 12,

    moveCursor: 'move',
    resizeCursor: { url: resizeSVG, x: 15, y: 15 },
    rotateCursor: { url: rotateSVG, x: 15, y: 15 },
    skewCursor: { url: skewSVG, x: 15, y: 15 },

    selector: true,
    hover: true,
    boxSelect: true,

    resizeable: true,
    rotateable: true,
    skewable: true
}