import { IBounds, IBox, IBoxInputData, IEventListenerId, IOverflow, IScroller, IScrollConfig, IScrollTheme, IObject } from '@leafer-ui/interface'
import { Group, Box, Bounds, DataHelper, DragEvent, LeafHelper, MoveEvent, DragBoundsHelper, ChildEvent, PointerEvent, Plugin, MathHelper, BranchHelper, isUndefined, BoundsEvent } from '@leafer-ui/core'

import { config } from './config'


const tempBounds = new Bounds(), { float } = MathHelper, { clone, assign } = DataHelper

export class Scroller extends Group implements IScroller {

    // 主题 map
    static themeMap: IObject = {}


    public target: IBox

    public config: IScrollConfig
    public mergedConfig: IScrollConfig

    public scrollXBar: IBox
    public scrollYBar: IBox

    // viewport 区域 / 内容区域
    public ratioX: number
    public ratioY: number

    // 滚动区域 / 内容区域
    public scrollRatioX: number
    public scrollRatioY: number

    // scroll之前的内容真实定位
    public contentRealX: number
    public contentRealY: number

    public dragScrolling: boolean

    // 用于比对数据，节流
    public targetOverflow: IOverflow
    public targetWorldBounds: IBounds = new Bounds()

    // viewport 与 内容区域
    public viewportBounds: IBounds = new Bounds()
    public contentBounds: IBounds = new Bounds()

    // 相对 viewport 区域收缩了一点边距
    public scrollXBounds: IBounds = new Bounds()
    public scrollYBounds: IBounds = new Bounds()


    protected get canUse(): boolean { return this.target.hasScroller }

    protected hideTimer: any

    protected __eventIds: IEventListenerId[]

    constructor(target: IBox) {
        super()
        this.target = target
        this.config = clone(config)
        this.updateConfig()
        this.__listenEvents()

        target.waitLeafer(() => {
            this.parent = target
            this.__bindLeafer(target.leafer)
        })

        if (this.mergedConfig.hideOnActionEnd) this.opacity = 0
    }


    static registerTheme(theme: IScrollTheme, themeConfig: IScrollConfig): void {
        S.themeMap[theme] = themeConfig
    }

    static getTheme(theme: IScrollTheme): IScrollConfig {
        return theme && S.themeMap[theme]
    }

    static hasTheme(theme: IScrollTheme): boolean {
        return theme && !!S.themeMap[theme]
    }


    public updateConfig(): void {
        const { scrollConfig } = this.target
        const themeConfig = S.getTheme((scrollConfig && S.hasTheme(scrollConfig.theme) && scrollConfig.theme) || this.config.theme)
        const mergedConfig: IScrollConfig = this.mergedConfig = clone(this.config)
        assign(mergedConfig, themeConfig)
        if (scrollConfig) assign(mergedConfig, scrollConfig)
        this.updateStyle(mergedConfig.style)
    }

    public updateStyle(style: IBoxInputData): void {
        if (!this.scrollXBar) this.addMany(this.scrollXBar = new Box(), this.scrollYBar = new Box())
        const { scrollXBar, scrollYBar } = this
        scrollXBar.set(style)
        scrollYBar.set(style)
        scrollXBar.draggable = 'x'
        scrollYBar.draggable = 'y'
    }

    public update(check: boolean = true): void {
        if (this.dragScrolling) return

        const { target, targetOverflow, targetWorldBounds, viewportBounds, contentBounds } = this, layout = target.__layout, { overflow } = target.__

        const { childrenRenderBounds } = layout // 内容 bounds
        const { boxBounds, worldBoxBounds } = layout // 容器 bounds

        const isSameWorldBounds = check && targetOverflow === overflow && targetWorldBounds.isSame(worldBoxBounds)
        const isSameConfig = layout.scrollConfigChanged ? (this.updateConfig(), layout.scrollConfigChanged = false) : true

        const nowContentBounds = tempBounds.set(viewportBounds).add(childrenRenderBounds)

        if (isSameWorldBounds && isSameConfig && contentBounds.isSame(nowContentBounds)) return // 节流

        this.targetOverflow = overflow
        viewportBounds.set(boxBounds)
        targetWorldBounds.set(worldBoxBounds)
        contentBounds.set(nowContentBounds)

        const { scrollXBar, scrollYBar } = this, { size, endsMargin, minSize } = this.mergedConfig, { width, height } = viewportBounds

        this.contentRealX = contentBounds.x - target.scrollX
        this.contentRealY = contentBounds.y - target.scrollY

        this.ratioX = viewportBounds.width / contentBounds.width
        this.ratioY = viewportBounds.height / contentBounds.height

        const min = size + endsMargin * 2 + minSize
        scrollXBar.visible = float(contentBounds.width) > float(width) && overflow !== 'y-scroll' && width > min
        scrollYBar.visible = float(contentBounds.height) > float(height) && overflow !== 'x-scroll' && height > min

        this.updateScrollBar()
    }

    public updateScrollBar() {
        const { target, viewportBounds, contentBounds, ratioX, ratioY, scrollXBar, scrollYBar, scrollXBounds, scrollYBounds } = this
        let { size, cornerRadius, endsMargin, sideMargin, minSize, scaleFixed, scrollType } = this.mergedConfig
        const scale = scaleFixed ? target.getClampRenderScale() : 1

        endsMargin /= scale
        sideMargin /= scale
        size /= scale
        if (isUndefined(cornerRadius)) cornerRadius = size / 2

        if (scrollXBar.visible) {
            scrollXBounds.set(viewportBounds).shrink([endsMargin, scrollYBar.visible ? size + sideMargin : endsMargin, sideMargin, endsMargin])
            const scrollRatioX = this.scrollRatioX = scrollXBounds.width / contentBounds.width

            scrollXBar.set({
                x: scrollXBounds.x - contentBounds.x * scrollRatioX,
                y: scrollXBounds.maxY - size,
                width: Math.max(scrollXBounds.width * ratioX, minSize),
                height: size,
                cornerRadius,
                dragBounds: scrollXBounds,
                hittable: scrollType !== 'move'
            })
        }

        if (scrollYBar.visible) {
            scrollYBounds.set(viewportBounds).shrink([endsMargin, sideMargin, scrollXBar.visible ? size + sideMargin : endsMargin, endsMargin])
            const scrollRatioY = this.scrollRatioY = scrollYBounds.height / contentBounds.height

            scrollYBar.set({
                x: scrollYBounds.maxX - size,
                y: scrollYBounds.y - contentBounds.y * scrollRatioY,
                width: size,
                height: Math.max(scrollYBounds.height * ratioY, minSize),
                cornerRadius,
                dragBounds: scrollYBounds,
                hittable: scrollType !== 'move'
            })
        }

        this.x = -this.target.scrollX
        this.y = -this.target.scrollY

        LeafHelper.updateAllMatrix(this)
        BranchHelper.updateBounds(this)
        LeafHelper.updateAllChange(this)
    }

    protected onDrag(e: DragEvent): void {
        if (this.mergedConfig.scrollType === 'move') return

        this.dragScrolling = true

        const { scrollXBar, scrollYBar, target, scrollXBounds, scrollYBounds } = this
        const scrollX = e.current === scrollXBar

        if (scrollX) target.scrollX = -((scrollXBar.x - scrollXBounds.x) / this.scrollRatioX + this.contentRealX)
        else target.scrollY = -((scrollYBar.y - scrollYBounds.y) / this.scrollRatioY + this.contentRealY)
    }

    protected onDragEnd(): void {
        if (this.mergedConfig.scrollType === 'move') return

        this.dragScrolling = false
    }

    protected onMove(e: MoveEvent): void {
        if (!this.canUse) return

        this.onEnter()

        const { scrollType, stopDefault } = this.mergedConfig
        if (scrollType === 'drag') return

        const { viewportBounds, contentBounds, scrollXBar, scrollYBar } = this
        if (scrollXBar.visible || scrollYBar.visible) {
            const move = e.getInnerMove(this.target)
            DragBoundsHelper.getValidMove(contentBounds, viewportBounds, 'inner', move, true)

            let needStop: boolean
            if (move.x && scrollXBar.visible) this.target.scrollX += move.x, needStop = true
            if (move.y && scrollYBar.visible) this.target.scrollY += move.y, needStop = true
            if (needStop || stopDefault) e.stop()
            if (stopDefault) e.stopDefault()
        }
    }

    protected onMoveEnd(e: MoveEvent): void {
        if (!this.canUse) return

        if (!this.target.hit(e)) this.onLeave()
    }

    protected onEnter() {
        if (!this.canUse) return

        clearTimeout(this.hideTimer)

        this.killAnimate()
        this.opacity = 1
    }

    protected onLeave() {
        if (!this.canUse) return

        clearTimeout(this.hideTimer)

        if (this.mergedConfig.hideOnActionEnd) this.hideTimer = setTimeout(() => {
            this.set({ opacity: 0 }, Plugin.has('animate'))
        }, 600)
    }

    protected onResize() {
        if (this.canUse) this.update()
    }

    protected __listenEvents(): void {
        const { scrollXBar, scrollYBar, target } = this
        this.__eventIds = [
            scrollXBar.on_(DragEvent.DRAG, this.onDrag, this),
            scrollXBar.on_(DragEvent.END, this.onDragEnd, this),

            scrollYBar.on_(DragEvent.DRAG, this.onDrag, this),
            scrollYBar.on_(DragEvent.END, this.onDragEnd, this),

            target.on_(PointerEvent.ENTER, this.onEnter, this),
            target.on_(PointerEvent.LEAVE, this.onLeave, this),

            target.on_(MoveEvent.BEFORE_MOVE, this.onMove, this),
            target.on_(MoveEvent.END, this.onMoveEnd, this),

            target.on_(BoundsEvent.WORLD, this.onResize, this), // 更新
            target.on_(ChildEvent.DESTROY, this.destroy, this)
        ]
    }

    protected __removeListenEvents(): void {
        this.off_(this.__eventIds)
    }

    public destroy(): void {
        if (!this.destroyed) {
            this.__removeListenEvents()
            const { target } = this
            target.scroller = target.topChildren = target.hasScroller = undefined
            this.target = this.config = null
            super.destroy()
        }
    }

}

const S = Scroller