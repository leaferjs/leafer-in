import { IText, IEventListenerId } from '@leafer-in/interface'
import { Matrix, PointerEvent, Text } from '@leafer-ui/core'
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

    protected inBody: boolean // App 的 view 为 canvas 类型时，文本编辑框只能添加到 body 下了
    protected isHTMLText: boolean
    protected _keyEvent: boolean

    public onLoad(): void {
        const { editor } = this
        const { config } = editor.app

        const text = this.editTarget
        text.textEditing = true

        this.isHTMLText = !(text instanceof Text) // HTMLText
        this._keyEvent = config.keyEvent
        config.keyEvent = false

        const div = this.editDom = document.createElement('div')
        const { style } = div
        div.contentEditable = 'true'
        style.position = 'fixed' // 防止文本输入到边界时产生滚动
        style.transformOrigin = 'left top'
        style.boxSizing = 'border-box'

        this.isHTMLText ? div.innerHTML = String(text.text) : div.innerText = String(text.text)

        const { view } = editor.app;
        (this.inBody = view instanceof HTMLCanvasElement) ? document.body.appendChild(div) : (view as HTMLDivElement).appendChild(div)

        // events 

        this.eventIds = [
            editor.app.on_(PointerEvent.DOWN, (e: PointerEvent) => {
                let { target } = e.origin, find: boolean
                while (target) {
                    if (target === div) find = true
                    target = target.parentElement
                }
                if (!find) editor.closeInnerEditor()
            })
        ]

        this.onFocus = this.onFocus.bind(this)
        this.onInput = this.onInput.bind(this)
        this.onUpdate = this.onUpdate.bind(this)
        this.onKeydown = this.onKeydown.bind(this)

        div.addEventListener("focus", this.onFocus)
        div.addEventListener("input", this.onInput)
        window.addEventListener('keydown', this.onKeydown)
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
        const { editDom } = this
        this.editTarget.text = this.isHTMLText ? editDom.innerHTML : editDom.innerText
    }

    protected onFocus(): void {
        this.editDom.style.outline = 'none'
    }

    protected onKeydown(e: KeyboardEvent): void {
        if (e.code === 'Escape') this.editor.closeInnerEditor()
        if (e.key === 'Enter') { // fix 换行产生 <div><br/></div> 
            e.preventDefault()

            // 手动插入 <br/>
            const br = document.createElement('br')
            const selection = window.getSelection()
            const range = selection.getRangeAt(0)
            range.deleteContents()
            range.insertNode(br)

            range.setStartAfter(br)
            range.setEndAfter(br)

            this.onInput()
        }
    }

    public onUpdate() {
        const { editTarget: text } = this

        // get text scale
        let textScale = 1

        if (!this.isHTMLText) {
            const { scaleX, scaleY } = text.worldTransform
            textScale = Math.max(Math.abs(scaleX), Math.abs(scaleY))

            const fontSize = text.fontSize * textScale
            if (fontSize < 12) textScale *= 12 / text.fontSize
        }

        this.textScale = textScale

        // layout
        const { a, b, c, d, e, f } = new Matrix(text.worldTransform).scale(1 / textScale)

        let { x, y } = this.inBody ? text.app.clientBounds : text.app.tree.clientBounds
        if (!this.inBody) x -= window.scrollX, y -= window.scrollY

        let { width, height } = text
        width *= textScale, height *= textScale

        const data = text.__

        if (data.__autoWidth && data.autoSizeAlign) {
            width += 20 // 加大一点防止换行
            switch (data.textAlign) {
                case 'center': x -= width / 2; break
                case 'right': x -= width
            }
        }

        if (data.__autoHeight && data.autoSizeAlign) {
            height += 20
            switch (data.verticalAlign) {
                case 'middle': y -= height / 2; break
                case 'bottom': y -= height
            }
        }

        const { style } = this.editDom
        style.transform = `matrix(${a},${b},${c},${d},${e},${f})`
        style.left = x + 'px'
        style.top = y + 'px'
        style.width = width + 'px'
        style.height = height + 'px'

        this.isHTMLText || updateStyle(this.editDom, text, textScale)
    }

    public onUnload(): void {
        const { editTarget: text, editor, editDom: dom } = this
        if (text) {
            this.onInput()
            text.textEditing = undefined

            if (editor.app) editor.app.config.keyEvent = this._keyEvent
            editor.off_(this.eventIds)

            dom.removeEventListener("focus", this.onFocus)
            dom.removeEventListener("input", this.onInput)
            window.removeEventListener('keydown', this.onKeydown)
            window.removeEventListener('scroll', this.onUpdate)

            dom.remove()
            this.editDom = this.eventIds = undefined
        }
    }

}