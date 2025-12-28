export { Scroller } from './Scroller'

import { Plugin, Box } from '@leafer-ui/core'
import { Scroller } from './Scroller'
import { scrollConfigType } from './decorate'


Plugin.add('scroller')


const box = Box.prototype

Box.addAttr('scrollConfig', undefined, scrollConfigType)

box.__checkScroll = function (isScrollMode: boolean) {
    if (isScrollMode && this.isOverflow) {
        if (!this.scroller) {
            this.scroller = new Scroller(this)
            if (!this.topChildren) this.topChildren = []
            this.topChildren.push(this.scroller)
        }
        this.hasScroller = true
    } else {
        if (this.hasScroller && !this.scroller.dragScrolling) {
            this.hasScroller = undefined
            this.scroller.update()
        }
    }
}

Scroller.registerTheme('light', { style: { fill: 'black' } }) // 白天模式
Scroller.registerTheme('dark', { style: { fill: 'white' } }) // 夜间模式