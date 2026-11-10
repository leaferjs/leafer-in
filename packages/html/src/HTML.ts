import { IUI } from '@leafer-ui/interface'
import { registerUI, dataProcessor, UI } from '@leafer-ui/draw'

import { IHTMLData, IHTMLInputData } from '@leafer-in/interface'

import { HTMLData } from './data/HTMLData'


@registerUI()
export class HTML extends UI implements IUI {

    public get __tag() { return 'HTML' }

    @dataProcessor(HTMLData)
    declare public __: IHTMLData

    public dom: HTMLDivElement

    protected inBody: boolean // App 的 view 为 canvas 类型时，文本编辑框只能添加到 body 下了

    constructor(data?: IHTMLInputData) {
        super(data)
        this.dom = document.createElement('div')
        const { style } = this.dom
        style.position = 'absolute' // 防止文本输入到边界时产生滚动
        style.transformOrigin = 'left top'
        style.left = '0px'
        style.top = '0px'
    }

    public __updateWorldBounds(): void {
        super.__updateWorldBounds()

        const { a, b, c, d, e, f } = this.__world
        const { style } = this.dom
        style.transform = `matrix(${a},${b},${c},${d},${e},${f})`
    }

    public __updateBoxBounds(): void {
        this.appendDom()
        super.__updateBoxBounds()
    }

    override __updateWorldOpacity(): void {
        super.__updateWorldOpacity()
        const { style } = this.dom
        style.opacity = this.__worldOpacity.toString()
        this.visible === 0 ? this.removeDom() : this.appendDom()
    }

    public appendDom(): void {
        const { dom } = this, { view, canvas } = this.app
        if (view && !dom.parentNode) {
            if (!canvas.overlayView) {
                const overlay = canvas.overlayView = document.createElement('div')
                overlay.classList.add('leafer-overlay-view');
                (view instanceof HTMLCanvasElement) ? view.parentElement.appendChild(overlay) : (view as HTMLDivElement).appendChild(overlay)
            }
            canvas.overlayView.appendChild(dom)
        }
    }

    public removeDom(): void {
        const { dom } = this
        if (dom.parentNode) dom.remove()
    }

    public destroy(): void {
        this.removeDom()
        super.destroy()
    }

}