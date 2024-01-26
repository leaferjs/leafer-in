import { IUIEvent } from '@leafer-ui/interface'

import { IEditor } from '@leafer-in/interface'

import { EditDataHelper } from '../helper/EditDataHelper'


export function updateCursor(editor: IEditor, e: IUIEvent): void {
    const { editBox } = editor, point = editBox.enterPoint
    if (!point || !editor.hasTarget || !editBox.visible) return

    let { rotation } = editBox
    const { resizeCursor, rotateCursor, skewCursor, resizeable, rotateable, skewable } = editor.config
    const { pointType } = point, { flippedX, flippedY } = editBox

    let showResize = pointType === 'resize'
    if (showResize && rotateable && (e.metaKey || e.ctrlKey || !resizeable)) showResize = false
    const showSkew = skewable && !showResize && point.name === 'resize-line'

    const cursor = showSkew ? skewCursor : (showResize ? resizeCursor : rotateCursor)
    rotation += (EditDataHelper.getFlipDirection(point.direction, flippedX, flippedY) + 1) * 45

    const { url, x, y } = cursor
    point.cursor = { url: toDataURL(url, rotation), x, y }
}

export function updateMoveCursor(editor: IEditor): void {
    editor.editBox.rect.cursor = editor.config.moveCursor
}


function toDataURL(svg: string, rotation: number): string {
    return '"data:image/svg+xml,' + encodeURIComponent(svg.replace('{{rotation}}', rotation.toString())) + '"'
}