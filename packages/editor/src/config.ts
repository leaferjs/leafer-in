import { IEditorConfig } from '@leafer-in/interface'

export const config: IEditorConfig = {
    type: 'pc',

    stroke: '#836DFF',
    strokeWidth: 2,

    pointFill: '#FFFFFF',
    pointSize: 8,
    pointRadius: 16,

    rotateGap: 45,

    hideOnMove: false,

    moveCursor: 'move',
    resizeType: 'auto',

    resizeCursor: ['nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize'],
    rotateCursor: ['ne-resize', 'e-resize', 'se-resize', 's-resize', 'sw-resize', 'w-resize', 'nw-resize', 'n-resize'],

    resizeable: true,
    rotateable: true,
    skewable: true
}