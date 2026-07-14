import { IEditBoxBase } from '@leafer-ui/interface'
import { IEditor } from './IEditor'
export interface IEditBox extends IEditBoxBase {

    editor: IEditor

}

export interface IEditBoxWidget {
    readonly tag: string
    editBox: IEditBox
    onLoad(): void
    onUpdate(): void
    onUnload(): void
    onDestroy(): void
}