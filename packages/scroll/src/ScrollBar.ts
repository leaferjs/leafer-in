import { IApp, IBounds, IBox, IBoxInputData, IEventListenerId, IGroup } from '@leafer-ui/interface'
import { Group, RenderEvent, ResizeEvent, Box, Bounds, DataHelper, DragEvent } from '@leafer-ui/core'

import { IScrollBar, IScrollBarConfig, IScrollBarTheme } from '@leafer-in/interface'


export class ScrollBar extends Group implements IScrollBar {

    public target: IGroup
    public config: IScrollBarConfig = {
        theme: 'light',
        padding: 0,
        minSize: 10
    }

    public scrollXBar: IBox
    public scrollYBar: IBox

    public ratioX: number
    public ratioY: number
    public dragScrolling: boolean
    public scrollBounds: IBounds

    public get isOutside() { return true }

    protected __dragOut: boolean | number
    protected __eventIds: IEventListenerId[]

    constructor(target: IGroup, userConfig?: IScrollBarConfig) {
        super()
        if (target.isApp) {
            (target as IApp).sky.add(this)
            target = (target as IApp).tree
        }
        this.target = target
        if (userConfig) DataHelper.assign(this.config, userConfig)
        this.changeTheme(this.config.theme)
        this.waitLeafer(this.__listenEvents, this)
    }

    public changeTheme(theme: IScrollBarTheme): void {
        let style: IBoxInputData

        if (typeof theme === 'string') {
            style = { fill: 'black', stroke: 'rgba(255,255,255,0.8)' }
            if (theme === 'dark') {
                style.fill = 'white'
                style.stroke = 'rgba(0,0,0,0.2)'
            }
        } else {
            style = theme
        }

        if (!this.scrollXBar) this.addMany(this.scrollXBar = new Box(), this.scrollYBar = new Box())

        style = Object.assign({ strokeAlign: 'center', opacity: 0.5, width: 6, cornerRadius: 3, hoverStyle: { opacity: 0.6 }, pressStyle: { opacity: 0.7 } } as IBoxInputData, style)
        if (!style.height) style.height = style.width
        this.scrollXBar.set({ ...style, visible: false })
        this.scrollYBar.set({ ...style, visible: false })
        if (this.leafer) this.update()
    }


    public update(check?: boolean): void {
        if (this.dragScrolling) return

        const { minSize, padding } = this.config
        const { zoomLayer, canvas } = this.target.leafer
        const { worldRenderBounds } = zoomLayer

        if (check && this.scrollBounds && this.scrollBounds.isSame(worldRenderBounds)) return
        this.scrollBounds = new Bounds(worldRenderBounds)

        const bounds = canvas.bounds.clone().shrink(padding)
        const totalBounds = bounds.clone().add(worldRenderBounds)

        const ratioX = this.ratioX = bounds.width / totalBounds.width
        const ratioY = this.ratioY = bounds.height / totalBounds.height
        const scrollRatioX = (bounds.x - totalBounds.x) / totalBounds.width
        const scrollRatioY = (bounds.y - totalBounds.y) / totalBounds.height
        const showScrollXBar = ratioX < 1
        const showScrollYBar = ratioY < 1

        const { scrollXBar, scrollYBar } = this
        const { x, y, width, height } = bounds.shrink([2, showScrollYBar ? scrollYBar.width + 6 : 2, showScrollXBar ? scrollXBar.height + 6 : 2, 2])

        scrollXBar.set({
            x: x + width * scrollRatioX,
            y: y + height + 2,
            width: Math.max(width * ratioX, minSize),
            visible: showScrollXBar
        })

        scrollYBar.set({
            x: x + width + 2,
            y: y + height * scrollRatioY,
            height: Math.max(height * ratioY, minSize),
            visible: showScrollYBar
        })
    }

    protected onDrag(e: DragEvent): void {
        this.dragScrolling = true
        this.__dragOut = this.app.config.move.dragOut
        this.app.config.move.dragOut = false

        const scrollX = e.current === this.scrollXBar
        const move = this.target.leafer.getValidMove(scrollX ? -e.moveX / this.ratioX : 0, scrollX ? 0 : -e.moveY / this.ratioY)
        this.target.moveWorld(move.x, move.y)
        e.current.moveWorld(move.x && -move.x * this.ratioX, move.y && -move.y * this.ratioY)
    }

    protected onDragEnd(): void {
        this.dragScrolling = false
        this.app.config.move.dragOut = this.__dragOut
    }

    protected __listenEvents(): void {
        const { scrollXBar, scrollYBar } = this
        this.__eventIds = [
            scrollXBar.on_(DragEvent.DRAG, this.onDrag, this),
            scrollYBar.on_(DragEvent.DRAG, this.onDrag, this),
            scrollXBar.on_(DragEvent.END, this.onDragEnd, this),
            scrollYBar.on_(DragEvent.END, this.onDragEnd, this),
            this.target.on_(RenderEvent.BEFORE, () => this.update(true)),
            this.target.leafer.on_(ResizeEvent.RESIZE, () => this.update())
        ]
    }

    protected __removeListenEvents(): void {
        this.off_(this.__eventIds)
    }

    public destroy(): void {
        if (!this.destroyed) {
            this.__removeListenEvents()
            this.target = this.config = null
            super.destroy()
        }
    }

}