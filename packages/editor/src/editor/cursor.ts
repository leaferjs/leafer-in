import { IObject, IUIEvent } from '@leafer-ui/interface'

import { IEditBox } from '@leafer-in/interface'
import { MathHelper } from '@leafer-ui/draw'

import { EditDataHelper } from '../helper/EditDataHelper'


const cacheCursors: IObject = {}

export function updatePointCursor(editBox: IEditBox, e: IUIEvent): void {
    const { enterPoint: point, dragging, skewing, resizing, flippedX, flippedY } = editBox
    if (!point || !editBox.editor.editing || !editBox.canUse) return
    if (point.name === 'rect') return updateMoveCursor(editBox) // rect 移动元素
    if (point.name === 'circle') return // 独立旋转按钮

    let { rotation } = editBox
    const { pointType } = point, { moveCursor, resizeCursor, rotateCursor, skewCursor, moveable, resizeable, rotateable, skewable } = editBox.mergeConfig

    if (pointType === 'move') { // 移动类型
        point.cursor = moveCursor
        if (!moveable) point.visible = false
        return
    } else if (pointType === 'button') { // 普通按钮
        if (!point.cursor) point.cursor = 'pointer'
        return
    }

    let showResize = pointType.includes('resize')
    if (showResize && rotateable && (editBox.isHoldRotateKey(e) || !resizeable)) showResize = false
    const showSkew = skewable && !showResize && (point.name === 'resize-line' || pointType === 'skew')

    const cursor = dragging
        ? (skewing ? skewCursor : (resizing ? resizeCursor : rotateCursor))
        : (showSkew ? skewCursor : (showResize ? resizeCursor : rotateCursor))

    rotation += (EditDataHelper.getFlipDirection(point.direction, flippedX, flippedY) + 1) * 45
    rotation = Math.round(MathHelper.formatRotation(rotation, true) / 2) * 2

    const { url, x, y } = cursor
    const key = url + rotation

    if (cacheCursors[key]) {
        point.cursor = cacheCursors[key]
    } else {
        cacheCursors[key] = point.cursor = { url: toDataURL(url, rotation), x, y }
    }
}

export function updateMoveCursor(editBox: IEditBox): void {
    const { moveCursor, moveable } = editBox.mergeConfig
    if (editBox.canUse) editBox.rect.cursor = moveable ? moveCursor : undefined
}


function toDataURL(svg: string, rotation: number): string {
    return '"data:image/svg+xml,' + encodeURIComponent(svg.replace('{{rotation}}', rotation.toString())) + '"'
}