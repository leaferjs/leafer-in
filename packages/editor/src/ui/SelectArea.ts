import { Group, Rect } from '@leafer-ui/core'
import { IBoundsData, IGroupInputData, IRect, IRectInputData } from '@leafer-ui/interface'

export class SelectArea extends Group {

    public strokeArea: IRect = new Rect({ strokeAlign: 'center' })
    public fillArea: IRect = new Rect()

    constructor(data?: IGroupInputData) {
        super(data)
        this.visible = this.hittable = false
        this.addMany(this.fillArea, this.strokeArea)
    }

    public setStyle(style: IRectInputData, userStyle?: IRectInputData): void {
        const { visible, stroke, strokeWidth } = style
        this.visible = visible
        this.strokeArea.reset({ ...(userStyle || { stroke, strokeWidth }) })
        this.fillArea.reset({ visible: userStyle ? false : true, fill: stroke, opacity: 0.1 })
    }

    public setBounds(bounds: IBoundsData): void {
        this.strokeArea.set(bounds)
        this.fillArea.set(bounds)
    }

}