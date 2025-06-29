import { ITwoPointBoundsData, ILeaferCanvas, IBounds, ISizeData } from '@leafer-ui/interface'
import { TwoPointBoundsHelper, Bounds } from '@leafer-ui/draw'


const { setPoint, addPoint, toBounds } = TwoPointBoundsHelper

export function getTrimBounds(canvas: ILeaferCanvas): IBounds {
    const { width, height } = canvas.view as ISizeData
    const { data } = canvas.context.getImageData(0, 0, width, height)
    let x: number, y: number, pointBounds: ITwoPointBoundsData, index: number = 0

    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] !== 0) {
            x = index % width
            y = (index - x) / width
            pointBounds ? addPoint(pointBounds, x, y) : setPoint(pointBounds = {} as ITwoPointBoundsData, x, y)
        }
        index++
    }

    const bounds = new Bounds()
    if (pointBounds) {
        toBounds(pointBounds, bounds)
        bounds.scale(1 / canvas.pixelRatio).ceil()
    }
    return bounds
}