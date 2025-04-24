
import { Leaf, Path, Line, Text, Polygon, Group, Box, UI } from '@leafer-ui/draw'

import { scaleResize, scaleResizeFontSize, scaleResizeGroup, scaleResizePath, scaleResizePoints } from './scaler'


// leaf

const leaf = Leaf.prototype

leaf.scaleResize = function (scaleX: number, scaleY = scaleX, noResize?: boolean): void {
    const data = this as UI
    if (noResize || (data.editConfig && data.editConfig.editSize === 'scale')) {
        data.scaleX *= scaleX
        data.scaleY *= scaleY
    } else {
        if (scaleX < 0) data.scaleX *= -1, scaleX = -scaleX
        if (scaleY < 0) data.scaleY *= -1, scaleY = -scaleY
        this.__scaleResize(scaleX, scaleY)
    }
}


leaf.__scaleResize = function (scaleX: number, scaleY: number): void {
    scaleResize(this, scaleX, scaleY)
}


leaf.resizeWidth = function (width: number): void {
    const scale = width / this.getBounds('box', 'local').width
    this.scaleOf(this.__layout.boxBounds, scale, this.__.lockRatio ? scale : 1, true)
}


leaf.resizeHeight = function (height: number): void {
    const scale = height / this.getBounds('box', 'local').height
    this.scaleOf(this.__layout.boxBounds, this.__.lockRatio ? scale : 1, scale, true)
}


// UI

Text.prototype.__scaleResize = function (scaleX: number, scaleY: number): void {
    const { app, editConfig } = this, editor = app && app.editor, dragPoint = editor && editor.dragPoint
    const { __autoWidth, __autoHeight, textAlign, verticalAlign } = this.__, { boxBounds } = this.__layout

    if (__autoWidth && textAlign !== 'left' && scaleX !== 1) this.x += boxBounds.x
    if (__autoHeight && verticalAlign !== 'top' && scaleY !== 1) this.y += boxBounds.y

    if (this.__.resizeFontSize || (editConfig && editConfig.editSize === 'font-size') || (dragPoint && editor.mergeConfig.editSize === 'font-size')) {
        scaleResizeFontSize(this, scaleX, scaleY, dragPoint && dragPoint.direction)
    } else {
        scaleResize(this, scaleX, scaleY)
    }
}


Path.prototype.__scaleResize = function (scaleX: number, scaleY: number): void {
    scaleResizePath(this, scaleX, scaleY)
}


Line.prototype.__scaleResize = function (scaleX: number, scaleY: number): void {
    if (this.pathInputed) {
        scaleResizePath(this, scaleX, scaleY)
    } else if (this.points) {
        scaleResizePoints(this, scaleX, scaleY)
    } else {
        this.width *= scaleX
    }
}


Polygon.prototype.__scaleResize = function (scaleX: number, scaleY: number): void {
    if (this.pathInputed) {
        scaleResizePath(this, scaleX, scaleY)
    } else if (this.points) {
        scaleResizePoints(this, scaleX, scaleY)
    } else {
        scaleResize(this, scaleX, scaleY)
    }
}


// group

Group.prototype.__scaleResize = function (scaleX: number, scaleY: number): void {
    scaleResizeGroup(this, scaleX, scaleY)
}


Box.prototype.__scaleResize = function (scaleX: number, scaleY: number): void {
    const { resizeChildren, __autoSize } = this.__
    if (!(__autoSize && resizeChildren)) scaleResize(this, scaleX, scaleY)
    if (resizeChildren) scaleResizeGroup(this, scaleX, scaleY)
}