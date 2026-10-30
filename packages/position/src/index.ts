import { IDirection, IInset } from '@leafer-ui/interface'
import { UI, Plugin, UnitConvert, isUndefined, LeafHelper, BranchHelper, isString, AlignHelper, getPointData, isObject, BoundsEvent } from '@leafer-ui/draw'

import '@leafer-in/resize'

import { positionType } from './decorate'


Plugin.add('position', 'resize')


// addAttr
UI.addAttr('position', false, positionType)


const tempPoint = getPointData()

UI.prototype.__updatePositionLayout = function (): boolean {

    const { leaferIsCreated, position, positionNode, boxBounds, parent } = this, { width, height } = boxBounds
    let parentBox = parent.boxBounds, align: IDirection, sizeChanged: boolean

    if (positionNode) {
        if (!positionNode.parent || positionNode.destroyed) return false
        this.__extraUpdate()
    }

    if (leaferIsCreated) this.leafer.created = false // 拦截布局更新通知，进行手动更新布局

    if (isString(position)) {

        align = position

    } else {

        let { left, top, right, bottom } = position

        if (positionNode) parentBox = positionNode.getBounds('box', positionNode.parent === parent ? 'local' : parent)

        if (position.align) {

            align = position.align

        } else {

            const { x: parentX, y: parentY, width: parentWidth, height: parentHeight } = parentBox

            const hasLeft = !isUndefined(left), hasTop = !isUndefined(top)

            // 布局
            if (hasLeft) {
                left = UnitConvert.number(left, parentWidth)
                this.x = parentX + left
            }

            if (!isUndefined(right)) {
                right = UnitConvert.number(right, parentWidth)

                if (hasLeft) this.resizeWidth(parentWidth - (left as number) - right), sizeChanged = true
                else this.x = parentX + parentWidth - width - right

            }

            if (hasTop) {
                top = UnitConvert.number(top, parentHeight)
                this.y = parentY + top
            }

            if (!isUndefined(bottom)) {
                bottom = UnitConvert.number(bottom, parentHeight)

                if (position.top !== undefined) this.resizeHeight(parentHeight - (top as number) - bottom), sizeChanged = true
                else this.y = parentY + parentHeight - height - bottom
            }
        }

    }

    if (align) {
        AlignHelper.toPoint(align, boxBounds, parentBox, tempPoint, false)
        this.set(tempPoint)
    }

    if (leaferIsCreated) this.leafer.created = true

    LeafHelper.updateAllMatrix(this)
    this.isBranch ? BranchHelper.updateBounds(this) : LeafHelper.updateBounds(this)

    return sizeChanged
}

// 监听相对元素
LeafHelper.listenPositionNode = function (leaf: UI): void {
    const { position, positionNode } = leaf

    if (isObject(position) && position.id) leaf.positionNode = isString(position.id) ? leaf.app.findId(position.id) : position.id
    else if (leaf.positionNode) leaf.positionNode = undefined

    if (positionNode !== leaf.positionNode) {
        if (positionNode) positionNode.off(positionNode.parent === leaf.parent ? BoundsEvent.LOCAL : BoundsEvent.WORLD, leaf.__updatePositionLayout) // leaf.__updatePositionLayout 在属性装饰器中已经绑定
        if (leaf.positionNode) {
            leaf.positionNode.on(leaf.positionNode.parent === leaf.parent ? BoundsEvent.LOCAL : BoundsEvent.WORLD, leaf.__updatePositionLayout)
            LeafHelper.updateBounds(leaf.positionNode)
        }
        leaf.__updatePositionLayout()
        if (!leaf.positionNode) leaf.__.__usePositionNode = undefined
    }
}

// 更新子级
LeafHelper.updatePositionLayout = function (leaf: UI): void {
    let hasPosition
    leaf.children.forEach(item => {
        if (item.position && !(item.position as IInset).id) {
            hasPosition = true
            item.__updatePositionLayout()
        }
    })
    leaf.__hasPosition = hasPosition
}
