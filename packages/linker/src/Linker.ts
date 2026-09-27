import { ILinker, ILinkerInputData, ILinkerData, ILinkerPointData, ILinkerPointOptions, ILinkerComputedPointData, ILinkerPointType, IPointData, IUI, IDirection4, ILeaf, IPointsCurve, IPointsCurveData } from '@leafer-ui/interface'
import { registerUI, dataProcessor, PathCommandDataHelper, pathType, isString, BoundsEvent, Line, PointHelper, BoundsHelper, LeafHelper, isObject } from '@leafer-ui/draw'

import { LinkerData } from './data/LinkerData'
import { LinkerHelper } from './helper/LinkerHelper'
import { linkerPointType } from './decorator'


const { moveTo, bezierCurveTo, drawPoints } = PathCommandDataHelper
const { isEmpty, getPoint } = BoundsHelper
const { getDistance } = PointHelper
const { getCtrlPoint, getDirectionForFromPoint, isOppositeDirection } = LinkerHelper
const { max, min, abs } = Math


@registerUI()
export class Linker extends Line implements ILinker {

    public get __tag() { return 'Linker' }

    @dataProcessor(LinkerData)
    declare public __: ILinkerData

    @linkerPointType()
    public startPoint?: ILinkerPointData

    @linkerPointType()
    public endPoint?: ILinkerPointData

    @pathType({ type: 'C', value: 0.5 } as IPointsCurveData)
    declare public curve?: IPointsCurve

    public startNode: IUI
    public endNode: IUI

    public startData: ILinkerComputedPointData
    public endData: ILinkerComputedPointData


    constructor(data?: ILinkerInputData) {
        super(data)
        this.onStartNodeChange = this.onStartNodeChange.bind(this)
        this.onEndNodeChange = this.onEndNodeChange.bind(this)
    }

    public __updatePath(): void {

        const layout = this.__layout

        const { startNode, endNode } = this

        if (layout.linkerChanged) {
            this.updateLinkerNode('start')
            this.updateLinkerNode('end')

            this.updateLinkerPoint('start')
            this.updateLinkerPoint('end')

            if (startNode !== this.startNode) this.listenLinkerNode(this.startNode, startNode, 'start')
            if (endNode !== this.endNode) this.listenLinkerNode(this.endNode, endNode, 'end')

            layout.linkerChanged = false
        }

        this.updateLinkerPath()
    }

    public listenLinkerNode(newNode: IUI, oldNode: IUI, type: ILinkerPointType): void {
        if (oldNode) {
            oldNode.off(BoundsEvent.WORLD, type === 'end' ? this.onEndNodeChange : this.onStartNodeChange)
            const list = type === 'end' ? oldNode.endLinker : oldNode.startLinker
            if (list) {
                const index = list.indexOf(this)
                if (index > -1) list.splice(index, 1)
            }
        }
        if (newNode) {
            newNode.on(BoundsEvent.WORLD, type === 'end' ? this.onEndNodeChange : this.onStartNodeChange)
            const list = type === 'end' ? (newNode.endLinker || (newNode.endLinker = [])) : (newNode.startLinker || (newNode.startLinker = []))
            list.push(this)
        }
    }

    public onStartNodeChange(): void {
        this.onLinkerNodeChange('start')
    }

    public onEndNodeChange(): void {
        this.onLinkerNodeChange('end')
    }

    public onLinkerNodeChange(type: ILinkerPointType): void {
        if (this.leaferIsCreated) {
            const { layouter, zoomLayer } = this.leafer
            if (layouter.__updatedList.has(zoomLayer)) return // 节流，画布缩放平移不用更新
            layouter.addExtra(this, true)
        }

        const { startData, endData } = this
        if (type == 'start') {
            this.updateLinkerPoint('start')
            if (endData && endData.auto) this.updateLinkerPoint('end')
        } else {
            if (startData && startData.auto) this.updateLinkerPoint('start')
            this.updateLinkerPoint('end')
        }

        this.__layout.boxChange()
        LeafHelper.updateBounds(this)
    }

    public updateLinkerNode(type: ILinkerPointType) {
        const { startPoint, endPoint } = this
        const nowPoint = type === 'end' ? endPoint : startPoint
        if (nowPoint) {
            const { id } = nowPoint
            const ui = id && (isString(id) ? this.app.findId(id) : id)
            type === 'end' ? this.endNode = ui : this.startNode = ui
        }
    }

    public getLinkerNodeCenter(type: ILinkerPointType): IPointData {
        const { startPoint, endPoint, startNode, endNode, startData, endData } = this
        const node = type === 'end' ? endNode : startNode
        const data = type === 'end' ? (endData || endPoint) : (startData || startPoint)
        if (node) {
            const { worldRenderBounds } = node
            if (isEmpty(worldRenderBounds)) LeafHelper.updateBounds(node) // 防止线条位于元素底部，先于元素布局
            return getPoint(node.worldRenderBounds, 'center')
        } else {
            return data && isObject(data.point) && this.getWorldPointByLocal(data.point)
        }
    }

    public updateLinkerPoint(type: ILinkerPointType) {
        const { startPoint, endPoint } = this
        const nowPoint = type === 'end' ? endPoint : startPoint
        if (nowPoint) {
            const data = {} as ILinkerComputedPointData
            const { id, offset } = nowPoint
            let { direction, point } = nowPoint

            if (direction === 'center' || (!direction && id && !point)) {
                const start = this.getLinkerNodeCenter('start')
                const end = this.getLinkerNodeCenter('end')
                const from = type === 'end' ? end : start
                const to = type === 'end' ? start : end
                if (from && to) direction = getDirectionForFromPoint(from, to)
                data.auto = true
            }


            if (!direction && isString(point)) direction = point as any as IDirection4


            data.direction = direction

            const ui = type === 'end' ? this.endNode : this.startNode

            let p: IPointData

            if (ui) {
                if (!point) point = direction
                if (point) {
                    const { boxBounds } = ui

                    if (isEmpty(boxBounds)) LeafHelper.updateBounds(ui) // 防止线条位于元素底部，先于元素布局
                    p = getPoint(boxBounds, point, true)
                    ui.getWorldPointByBox(p, this, false, true)
                }
            } else {
                if (isObject(point)) p = point
            }

            if (p && offset) {
                const o = { ...offset } as IPointData
                if (!offset.x) o.x = 0
                if (!offset.y) o.y = 0

                if (ui) ui.getWorldPoint(o, this, true, true)
                PointHelper.move(p, o)
            }

            data.point = p

            type === 'end' ? this.endData = p && data : this.startData = p && data

        }
    }


    public updateLinkerPath() {
        const data = this.__
        const path: number[] = data.path = []

        const hasPoints = data.points && data.points.length

        const { startData, endData, startNode, endNode } = this
        if (!startData || !endData) {
            return
        }

        const startPoint = startData.point, endPoint = endData.point
        const startDirection = startData.direction, endDirection = endData.direction

        const half: IPointData = {
            x: abs((startPoint.x - endPoint.x) / 2),
            y: abs((startPoint.y - endPoint.y) / 2)
        }


        const arrowWidth = this.__.strokeWidth * 8

        let minCtrl: number

        if (this.__.__useArrow) {
            const ratio = min(getDistance(startPoint, endPoint) / (arrowWidth * 25), 1) // 控制add 手柄的长度与两点间的距离有关
            minCtrl = max(arrowWidth * ratio * 12, arrowWidth * 3,) // 控制手柄最少不能低于3个箭头的宽度
        } else {
            minCtrl = arrowWidth * 2
        }

        if (endDirection) {

            if (isOppositeDirection(startDirection, endDirection) && startDirection === getDirectionForFromPoint(startPoint, endPoint)) // 正好处于相反的位置, 不需要太长的控制手柄
            {
                minCtrl = arrowWidth * 2
            }

        }

        half.x = max(minCtrl, half.x)
        half.y = max(minCtrl, half.y)

        if (hasPoints) {
            minCtrl *= 0.6
            const points = PointHelper.toNumberPoints(data.points)
            drawPoints(path, [startPoint.x, startPoint.y, ...points, endPoint.x, endPoint.y], data.curve, false, data)

            if (startDirection) {
                const handleX = path[4]
                const handleY = path[5]

                half.x = max(minCtrl, abs(handleX - startPoint.x))
                half.y = max(minCtrl, abs(handleY - startPoint.y))
                const startCtrlPoint: IPointData = getCtrlPoint(this, startNode, startPoint, startDirection, half)
                path[4] = startCtrlPoint.x
                path[5] = startCtrlPoint.y
            }

            const len = path.length
            if (endDirection) {

                const handleX = path[len - 4]
                const handleY = path[len - 3]

                half.x = max(minCtrl, abs(handleX - endPoint.x))
                half.y = max(minCtrl, abs(handleY - endPoint.y))
                const endCtrlPoint: IPointData = getCtrlPoint(this, endNode, endPoint, endDirection, half)
                path[len - 4] = endCtrlPoint.x
                path[len - 3] = endCtrlPoint.y
            } else {
                path[len - 4] = endPoint.x
                path[len - 3] = endPoint.y
            }

        } else {

            const startCtrlPoint: IPointData = startDirection ? getCtrlPoint(this, startNode, startPoint, startDirection, half) : startPoint
            const endCtrlPoint: IPointData = endDirection ? getCtrlPoint(this, endNode, endPoint, endDirection, half) : endPoint

            moveTo(path, startPoint.x, startPoint.y)
            bezierCurveTo(path, startCtrlPoint.x, startCtrlPoint.y, endCtrlPoint.x, endCtrlPoint.y, endPoint.x, endPoint.y)
        }


    }

    public createStartPoint(worldPoint: IPointData, node?: ILeaf, options?: ILinkerPointOptions): ILinkerPointData {
        const data = this.createLinkerPoint(worldPoint, node, options)
        this.startPoint = data
        return data
    }

    public createEndPoint(worldPoint: IPointData, node?: ILeaf, options?: ILinkerPointOptions): ILinkerPointData {
        const data = this.createLinkerPoint(worldPoint, node, options)
        this.endPoint = data
        return data
    }

    public createLinkerPoint(worldPoint: IPointData, node?: ILeaf, options?: ILinkerPointOptions): ILinkerPointData {
        const data: ILinkerPointData = {}
        if (node && node.id) {
            const point = node.getBoxPoint(worldPoint)
            const { boxBounds } = node

            const mode = options && options.mode

            const edge = mode === 'edge' || !mode
            const four = mode === 'four'
            const auto = mode === 'auto'
            const free = mode === 'free'

            if (!auto) {

                if (four) {
                    data.point = LinkerHelper.getDirection(point, boxBounds, four)
                } else {
                    data.direction = LinkerHelper.getDirection(point, boxBounds, edge)
                    data.point = LinkerHelper.getPointDirection(point, boxBounds, edge) || data.direction
                    if (data.point === data.direction) delete data.direction

                    if (free || edge) {
                        const snapPoint = BoundsHelper.getPoint(boxBounds, data.point)

                        const offsetX = point.x - snapPoint.x
                        const offsetY = point.y - snapPoint.y

                        const snapRadius = (options && options.snapRadius) || 10

                        if (Math.abs(offsetX) > snapRadius || Math.abs(offsetY) > snapRadius) {
                            const offset = data.offset = {
                                x: Math.abs(offsetX) > snapRadius ? offsetX : 0,
                                y: Math.abs(offsetY) > snapRadius ? offsetY : 0
                            }

                            if (edge && (offset.x || offset.y)) {
                                switch (data.direction || data.point) {
                                    case 'top':
                                    case 'bottom':
                                        offset.y = 0; break
                                    case 'right':
                                    case 'left':
                                        offset.x = 0; break
                                    default:
                                        if (offset.x > offset.y) offset.y = 0
                                        else offset.x = 0
                                }

                            }
                        }
                    }
                }

            }

            data.id = node.id
        } else {
            data.point = this.getLocalPoint(worldPoint)
        }

        return data
    }

}