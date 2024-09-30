import { IObject, IFunction } from '@leafer-ui/interface'
import { PropertyEvent, Rect } from '@leafer-ui/draw'

import { IEditor, ISimulateElement } from '@leafer-in/interface'


const checkMap: IObject = { x: 1, y: 1, scaleX: 1, scaleY: 1, rotation: 1, skewX: 1, skewY: 1 }, origin = 'top-left'

export class SimulateElement extends Rect implements ISimulateElement {

    public checkChange: boolean = true

    constructor(editor: IEditor) {
        super()

        this.visible = false

        this.on(PropertyEvent.CHANGE, (event: PropertyEvent) => {
            if (this.checkChange && checkMap[event.attrName]) {

                const { attrName, newValue, oldValue } = event
                const addValue = attrName[0] === 's' ? (<number>newValue || 1) / (<number>oldValue || 1) : (<number>newValue || 0) - (<number>oldValue || 0)

                const { leaferIsCreated, leafer } = this

                if (leaferIsCreated) leafer.created = false;
                (this as any)[attrName] = oldValue  // 恢复到之前，再使用editor操作修改
                if (leaferIsCreated) leafer.created = true

                switch (attrName) {
                    case 'x':
                        editor.move(addValue, 0)
                        break
                    case 'y':
                        editor.move(0, addValue)
                        break
                    case 'rotation':
                        editor.rotateOf(origin, addValue)
                        break
                    case 'scaleX':
                        editor.scaleOf(origin, addValue, 1)
                        break
                    case 'scaleY':
                        editor.scaleOf(origin, 1, addValue)
                        break
                    case 'skewX':
                        editor.skewOf(origin, addValue, 0)
                        break
                    case 'skewY':
                        editor.skewOf(origin, 0, addValue)
                }
            }
        })
    }

    public safeChange(changeFn: IFunction): void {
        this.checkChange = false
        changeFn()
        this.checkChange = true
    }
}