import { IText, IEventListenerId } from '@leafer-in/interface'
import { Matrix, PointerEvent } from '@leafer-ui/core'
import { InnerEditor, registerInnerEditor } from '@leafer-in/editor'
import { updateStyle } from './updateStyle'


@registerInnerEditor()
export class TextEditor extends InnerEditor {

    public get tag() { return 'TextEditor' }
    declare public editTarget: IText

    public editDom: HTMLDivElement
    public textScale: number

    public config = {
        selectAll: true
    }

    public eventIds: IEventListenerId[] = []

    protected inBody: boolean
    protected _keyEvent: boolean

    public onLoad(): void {
        const { editor } = this
        const { config } = editor.app

        this._keyEvent = config.keyEvent
        config.keyEvent = false

        const text = this.editTarget
        text.visible = false

        const div = this.editDom = document.createElement('div')
        const { style } = div
        div.contentEditable = 'true'
        div.innerText = text.text

        style.position = 'fixed' // 防止文本输入到边界时产生滚动
        style.transformOrigin = 'left top'
        style.boxSizing = 'border-box'

        const { scaleX, scaleY } = text.worldTransform
        this.textScale = Math.max(Math.abs(scaleX), Math.abs(scaleY))

        const fontSize = text.fontSize * this.textScale
        if (fontSize < 12) this.textScale *= 12 / fontSize

        const { view } = editor.app;
        (this.inBody = view instanceof HTMLCanvasElement) ? document.body.appendChild(div) : (view as HTMLDivElement).appendChild(div)

        // events 

        this.eventIds = [
            editor.app.on_(PointerEvent.DOWN, (e: PointerEvent) => { if (e.origin.target !== div) editor.closeInnerEditor() })
        ]

        this.onFocus = this.onFocus.bind(this)
        this.onInput = this.onInput.bind(this)
        this.onUpdate = this.onUpdate.bind(this)
        this.onEscape = this.onEscape.bind(this)

        div.addEventListener("focus", this.onFocus)
        div.addEventListener("input", this.onInput)
        window.addEventListener('keydown', this.onEscape)
        window.addEventListener('scroll', this.onUpdate)

        // select

        const selection = window.getSelection()
        const range = document.createRange()

        if (this.config.selectAll) {
            range.selectNodeContents(div)
        } else {
            const node = div.childNodes[0]
            range.setStartAfter(node)
            range.setEndAfter(node)
            range.collapse(true)
        }

        selection.removeAllRanges()
        selection.addRange(range)

    }

    protected onInput(): void {
        this.editTarget.text = this.editDom.innerText.replace(/\n\n/, '\n')
    }

    protected onFocus(): void {
        this.editDom.style.outline = 'none'
    }

    protected onEscape(e: KeyboardEvent): void {
        if (e.code === 'Escape') this.editor.closeInnerEditor()
    }

    public onUpdate() {
        const { editTarget: text, textScale } = this
        const { style } = this.editDom
        const { x, y } = this.inBody ? text.app.clientBounds : text.app.tree.clientBounds
        const { a, b, c, d, e, f } = new Matrix(text.worldTransform).scale(1 / textScale)

        style.transform = `matrix(${a},${b},${c},${d},${e},${f})`
        style.left = x - window.scrollX + 'px'
        style.top = y - window.scrollY + 'px'
        style.width = text.width * textScale + (text.__.__autoWidth ? 20 : 0) + 'px'
        style.height = text.height * textScale + (text.__.__autoHeight ? 20 : 0) + 'px'
        updateStyle(this.editDom, text, this.textScale)
    }

    public onUnload(): void {
        const { editTarget: text, editor, editDom: dom } = this
        if (text) {
            this.onInput()
            text.visible = true

            editor.app.config.keyEvent = this._keyEvent
            editor.off_(this.eventIds)

            dom.removeEventListener("focus", this.onFocus)
            dom.removeEventListener("input", this.onInput)
            window.removeEventListener('keydown', this.onEscape)
            window.removeEventListener('scroll', this.onUpdate)

            dom.remove()
            this.editDom = this.eventIds = undefined
        }
    }

}