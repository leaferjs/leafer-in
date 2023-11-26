import { IEditorConfig } from '@leafer-in/interface'

export const config: IEditorConfig = {
    selector: true,
    boxSelect: true,

    editSize: 'auto',

    stroke: '#836DFF',
    strokeWidth: 2,

    pointFill: '#FFFFFF',
    pointSize: 8,
    pointRadius: 16,

    rotateGap: 45,

    buttonsDirection: 'bottom',
    buttonsMargin: 12,

    moveCursor: 'move',
    resizeCursor: ['nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize'],
    rotateCursor: ['ne-resize', 'e-resize', 'se-resize', 's-resize', 'sw-resize', 'w-resize', 'nw-resize', 'n-resize'],

    resizeable: true,
    rotateable: true,
    skewable: true
}