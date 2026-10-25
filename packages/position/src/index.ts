import { UI, Plugin, UnitConvert, isUndefined, LeafHelper, BranchHelper, isString, AlignHelper, getPointData } from '@leafer-ui/draw'

import '@leafer-in/resize'

import { positionType } from './decorate'


Plugin.add('position', 'resize')


// addAttr
UI.addAttr('position', false, positionType)


const tempPoint = getPointData()

UI.prototype.__updatePositionLayout = function (): boolean {

    let sizeChanged: boolean
    const { leaferIsCreated, position, boxBounds } = this, parentBox = this.parent.boxBounds
    const { width: parentWidth, height: parentHeight } = parentBox, { width, height } = boxBounds

    if (leaferIsCreated) this.leafer.created = false // 拦截布局更新通知，进行手动更新布局

    if (isString(position)) {

        AlignHelper.toPoint(position, boxBounds, parentBox, tempPoint, true)
        this.set(tempPoint)

    } else {

        let { left, top, right, bottom } = position
        const hasLeft = !isUndefined(left), hasTop = !isUndefined(top)

        // 布局
        if (hasLeft) {
            left = UnitConvert.number(left, parentWidth)
            this.x = left
        }

        if (!isUndefined(right)) {
            right = UnitConvert.number(right, parentWidth)

            if (hasLeft) this.resizeWidth(parentWidth - (left as number) - right), sizeChanged = true
            else this.x = parentWidth - width - right

        }

        if (hasTop) {
            top = UnitConvert.number(top, parentHeight)
            this.y = top
        }

        if (!isUndefined(bottom)) {
            bottom = UnitConvert.number(bottom, parentHeight)

            if (position.top !== undefined) this.resizeHeight(parentHeight - (top as number) - bottom), sizeChanged = true
            else this.y = parentHeight - height - bottom
        }
    }


    if (leaferIsCreated) this.leafer.created = true
    return sizeChanged
}

LeafHelper.updatePositionLayout = function (leaf: UI): void {
    let hasPosition
    leaf.children.forEach(item => {
        if (item.position) {
            hasPosition = true
            item.__updatePositionLayout()
            LeafHelper.updateAllMatrix(item)
            item.isBranch ? BranchHelper.updateBounds(item) : LeafHelper.updateBounds(item)
        }
    })
    leaf.__hasPosition = hasPosition
}
