import { IObject, IFunction, IMatrix } from '@leafer-ui/interface'
import { LeafHelper, Matrix, PropertyEvent, Rect } from '@leafer-ui/draw'

import { IEditor, ISimulateElement } from '@leafer-in/interface'


const { updateMatrix } = LeafHelper
const checkMap: IObject = { x: 1, y: 1, scaleX: 1, scaleY: 1, rotation: 1, skewX: 1, skewY: 1 }, origin = 'top-left'

export class SimulateElement extends Rect implements ISimulateElement {

    public get __tag() { return 'SimulateElement' }

    public checkChange = true

    public canChange = true

    public changedTransform: IMatrix


    constructor(editor: IEditor) {
        super()

        this.visible = false

        this.on(PropertyEvent.CHANGE, (event: PropertyEvent) => {

            if (this.checkChange && checkMap[event.attrName]) {

                const { attrName, newValue, oldValue } = event
                const addValue = attrName[0] === 's' ? (<number>newValue || 1) / (<number>oldValue || 1) : (<number>newValue || 0) - (<number>oldValue || 0)

                this.canChange = false

                const data: IObject = this.__

                // old matrix
                data[attrName] = oldValue
                updateMatrix(this.parent)
                updateMatrix(this)

                const oldMatrix = new Matrix(this.__world)

                // new matrix
                data[attrName] = newValue
                this.__layout.rotationChange()
                updateMatrix(this)

                this.changedTransform = new Matrix(this.__world).divide(oldMatrix) // world change transform

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

                this.canChange = true

            }
        })
    }

    public safeChange(changeFn: IFunction): void {
        if (this.canChange) {
            this.checkChange = false
            changeFn()
            this.checkChange = true
        }
    }
}