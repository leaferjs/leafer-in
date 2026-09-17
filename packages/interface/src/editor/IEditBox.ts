import { IEditBoxBase, IDragEvent, IMoveEvent } from '@leafer-ui/interface'
import { IEditor } from './IEditor'

export interface IEditBox extends IEditBoxBase {

    editor: IEditor

}

export interface IEditBoxWidget {
    readonly tag: string
    editBox: IEditBox

    // 生命周期
    onLoad(): void
    onUpdate(): void
    onUnload(): void

    // 操作
    onMoveStart?(e: IDragEvent | IMoveEvent): void
    onMove?(e: IDragEvent | IMoveEvent): void
    onMoveEnd?(e: IDragEvent | IMoveEvent): void

    onDestroy(): void
}