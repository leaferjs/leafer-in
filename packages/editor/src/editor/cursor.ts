import { ICursorType, IUIEvent } from '@leafer-ui/interface'
import { IDirection8, IEditor } from '@leafer-in/interface'

import { EditDataHelper } from '../helper/EditDataHelper'


const { topLeft, top, topRight, right, bottomRight, bottom, bottomLeft, left } = IDirection8

export function updateCursor(editor: IEditor, e: IUIEvent): void {
    const { editBox } = editor, point = editBox.enterPoint
    if (!point || !editor.hasTarget || !editBox.visible) return

    let { rotation } = editBox
    let { resizeCursor, rotateCursor, resizeable, rotateable } = editor.config
    const { direction, pointType } = point

    editBox.enterPoint = point
    const isResizePoint = pointType === 'resize'

    if (isResizePoint && rotateable && (e.metaKey || e.ctrlKey || !resizeable)) resizeCursor = rotateCursor

    if (editBox.flipped) {
        const { flippedX, flippedY } = editBox
        mirrorCursors(resizeCursor = [...resizeCursor], flippedX, flippedY)
        mirrorCursors(rotateCursor = [...rotateCursor], flippedY, flippedX)
        if (editBox.flippedOne) rotation = -rotation
    }

    const index = EditDataHelper.getRotateDirection(direction, rotation)
    point.cursor = isResizePoint ? resizeCursor[index] : rotateCursor[index]
}

export function updateMoveCursor(editor: IEditor): void {
    editor.editBox.rect.cursor = editor.config.moveCursor
}


export function mirrorCursors(mirror: ICursorType[], mirrorX: boolean, mirrorY: boolean): void {
    if (mirrorX) {
        const topCursor = mirror[top], topLeftCursor = mirror[topLeft], topRightCursor = mirror[topRight]
        mirror[top] = mirror[bottom]
        mirror[topLeft] = mirror[bottomLeft]
        mirror[topRight] = mirror[bottomRight]
        mirror[bottom] = topCursor
        mirror[bottomLeft] = topLeftCursor
        mirror[bottomRight] = topRightCursor
    }

    if (mirrorY) {
        const leftCursor = mirror[left], topLeftCursor = mirror[topLeft], bottomLeftCursor = mirror[bottomLeft]
        mirror[left] = mirror[right]
        mirror[topLeft] = mirror[topRight]
        mirror[bottomLeft] = mirror[bottomRight]
        mirror[right] = leftCursor
        mirror[topRight] = topLeftCursor
        mirror[bottomRight] = bottomLeftCursor
    }
}