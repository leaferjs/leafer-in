import { IPointData } from '@leafer-ui/interface'
import { IEditor, IEditResizeEvent, IEditRotateEvent, IEditTool, IEditSkewEvent, IEditMoveEvent } from '@leafer-in/interface'

export class EditTool implements IEditTool {

    static list: IEditTool[] = []

    public tag = 'EditTool'

    getMirrorData(editor: IEditor): IPointData {
        const { scaleX, scaleY } = editor.editBox
        return {
            x: scaleX < 0 ? 1 : 0, // 1 = mirrorX
            y: scaleY < 0 ? 1 : 0
        }
    }

    onMove(e: IEditMoveEvent): void {
        const { moveX, moveY, editor } = e
        editor.leafList.forEach(target => {
            const move = target.getLocalPoint({ x: moveX, y: moveY }, null, true)
            target.move(move.x, move.y)
        })
    }

    onScale(e: IEditResizeEvent): void {
        const { scaleX, scaleY, transform, worldOrigin, editor } = e
        editor.leafList.forEach(target => {
            const resize = editor.getEditSize(target) === 'size'
            if (transform) {
                target.transform(transform, resize)
            } else {
                target.scaleOf(target.getInnerPoint(worldOrigin), scaleX, scaleY, resize)
            }
        })
    }

    onRotate(e: IEditRotateEvent): void {
        const { rotation, worldOrigin, editor } = e
        editor.leafList.forEach(target => {
            target.rotateOf(target.getInnerPoint(worldOrigin), rotation)
        })

    }

    onSkew(e: IEditSkewEvent): void {
        const { skewX, skewY, transform, worldOrigin, editor } = e
        editor.leafList.forEach(target => {
            const resize = editor.getEditSize(target) === 'size'
            if (transform) {
                target.transform(transform, resize)
            } else {
                target.skewOf(target.getInnerPoint(worldOrigin), skewX, skewY, resize)
            }
        })
    }

    update(editor: IEditor) {
        const { targetSimulate, leafList } = editor

        let target = leafList.list[0]

        if (editor.multiple) {
            target = targetSimulate
            targetSimulate.parent.updateLayout()
        }

        const { x, y, scaleX, scaleY, rotation, skewX, skewY, width, height } = target.getLayoutBounds('box', editor, true)
        editor.editBox.set({ x, y, scaleX, scaleY, rotation, skewX, skewY })
        editor.editBox.update({ x: 0, y: 0, width, height })
    }

}