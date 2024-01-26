import { IUIEvent } from '@leafer-ui/interface'
import { IEditor } from '@leafer-in/interface'


export function updateCursor(editor: IEditor, e: IUIEvent): void {
    const { editBox } = editor, point = editBox.enterPoint
    if (!point || !editor.hasTarget || !editBox.visible) return

    let { rotation } = editBox, showResizeCursor: boolean
    const { resizeCursor, rotateCursor, resizeable, rotateable } = editor.config
    const { direction, pointType } = point

    const isResizePoint = showResizeCursor = pointType === 'resize'
    if (isResizePoint && rotateable && (e.metaKey || e.ctrlKey || !resizeable)) showResizeCursor = false
    if (editBox.flippedOne) rotation = -rotation

    const { url, x, y } = showResizeCursor ? resizeCursor : rotateCursor
    rotation += (direction + 1) * 45

    point.cursor = { url: toDataURL(url, rotation), x, y }
}

export function updateMoveCursor(editor: IEditor): void {
    editor.editBox.rect.cursor = editor.config.moveCursor
}


function toDataURL(svg: string, rotation: number): string {
    return '"data:image/svg+xml,' + encodeURIComponent(svg.replace('{{rotation}}', rotation.toString())) + '"'
}