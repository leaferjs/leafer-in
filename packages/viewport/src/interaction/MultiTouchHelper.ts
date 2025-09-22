import { IMultiTouchData, IKeepTouchData, IGestureType, IPointData, ISingleGestureConfig } from '@leafer-ui/interface'

import { PointHelper } from '@leafer-ui/core'


export const MultiTouchHelper = {

    state: { // 单一手势识别状态
        type: 'none' as IGestureType,
        typeCount: 0,
        startTime: 0,
        totalData: null as IMultiTouchData,
        center: {} as IPointData
    },

    getData(list: IKeepTouchData[]): IMultiTouchData {
        const a = list[0], b = list[1]
        const lastCenter = PointHelper.getCenter(a.from, b.from)
        const center = PointHelper.getCenter(a.to, b.to)
        const move = { x: center.x - lastCenter.x, y: center.y - lastCenter.y }

        const lastDistance = PointHelper.getDistance(a.from, b.from)
        const distance = PointHelper.getDistance(a.to, b.to)
        const scale = distance / lastDistance

        const rotation = PointHelper.getRotation(a.from, b.from, a.to, b.to)
        return { move, scale, rotation, center }
    },

    getType(data: IMultiTouchData, config: ISingleGestureConfig): IGestureType {
        const moveScore = Math.hypot(data.move.x, data.move.y) / (config.move || 6)
        const scaleScore = Math.abs(data.scale - 1) / (config.scale || 0.03)
        const rotateScore = Math.abs(data.rotation) / (config.rotation || 2)

        if (moveScore < 1 && scaleScore < 1 && rotateScore < 1) return 'none'
        if (moveScore >= scaleScore && moveScore >= rotateScore) return 'move'
        if (scaleScore >= rotateScore) return 'zoom'
        return 'rotate'
    },

    // 识别单一手势
    detect(data: IMultiTouchData, config: ISingleGestureConfig): IGestureType {
        const { state } = M
        const type = M.getType(data, config)

        if (!state.totalData) {
            state.startTime = Date.now()
            state.center = data.center
        }

        M.add(data, state.totalData)
        state.totalData = data

        if (type === state.type) { // 连续多帧一样的类型才进行锁定
            state.typeCount++
            if (state.typeCount >= (config.count || 2) && type !== 'none') return type
        } else {
            state.type = type
            state.typeCount = 1
        }

        if ((Date.now() - state.startTime) >= (config.time || 200)) return M.getType(state.totalData, config) // 限制最长识别时间

        return 'none'
    },

    add(data: IMultiTouchData, add: IMultiTouchData): void {
        if (!add) return
        PointHelper.move(data.move, add.move)
        data.scale *= add.scale
        data.rotation += add.rotation
        data.center = add.center
    },

    reset() {
        const { state } = M
        state.type = 'none'
        state.typeCount = 0
        state.startTime = 0
        state.totalData = null
    }

}

const M = MultiTouchHelper