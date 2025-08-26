import { IPathArrowModule, IUI, IPathCommandData, IPointData, IPathDataArrow } from '@leafer-ui/interface'
import { PathCommandMap as Command, PointHelper } from '@leafer-ui/draw'

import { arrows, getArrowPath } from './data/arrows'


const { M, L, C, Q, Z, N, D, X, G, F, O, P, U } = Command
const { copy, copyFrom, getDistancePoint, } = PointHelper

const connectPoint = {} as IPointData
const first = {} as IPointData, second = {} as IPointData
const last = {} as IPointData, now = {} as IPointData

export const PathArrowModule: IPathArrowModule = {

    list: arrows,

    addArrows(ui: IUI): void {
        const { startArrow, endArrow, strokeWidth, dashPattern, __pathForRender: data, cornerRadius } = ui.__

        const clonePathForArrow = !cornerRadius // cornerRadius会创建新的render路径，所以不用再clone

        let command: number, i = 0, len = data.length, count = 0, useStartArrow = startArrow && startArrow !== 'none'

        while (i < len) {

            command = data[i]

            switch (command) {
                case M:  // moveto(x, y)
                case L:  // lineto(x, y)
                    if (count < 2 || i + 6 >= len) { // 3 + 3 可能是两个连续L命令结束
                        copyFrom(now, data[i + 1], data[i + 2])
                        if (!count && useStartArrow) copy(first, now)
                    }
                    i += 3
                    break
                case C:  // bezierCurveTo(x1, y1, x2, y2, x, y)
                    if (count === 1 || i + 7 >= len - 3) copyPoints(data, last, now, i + 3) // C 或 C + L结束
                    i += 7
                    break
                case Q:  // quadraticCurveTo(x1, y1, x, y)
                    if (count === 1 || i + 5 >= len - 3) copyPoints(data, last, now, i + 1) // Q 或 Q + L结束
                    i += 5
                    break
                case Z:  // closepath()
                    return // no arrow

                // canvas command

                case N: // rect(x, y, width, height)
                    i += 5
                    break
                case D: // roundRect(x, y, width, height, radius1, radius2, radius3, radius4)
                    i += 9
                    break
                case X: // simple roundRect(x, y, width, height, radius)
                    i += 6
                    break
                case G: // ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise)
                    i += 9
                    break
                case F: // simple ellipse(x, y, radiusX, radiusY)
                    i += 5
                    break
                case O: // arc(x, y, radius, startAngle, endAngle, anticlockwise)
                    i += 7
                    break
                case P: // simple arc(x, y, radius)
                    i += 4
                    break
                case U: // arcTo(x1, y1, x2, y2, radius)
                    if (count === 1 || i + 6 >= len - 3) { // U 或 U + L结束
                        copyPoints(data, last, now, i + 1)
                        if (i + 6 !== len) { // 避免与结束点重合
                            now.x -= (now.x - last.x) / 10
                            now.y -= (now.y - last.y) / 10
                        }
                    }
                    i += 6
                    break
            }

            count++

            if (count === 1 && command !== M) return // no arrow
            if (count === 2 && useStartArrow) copy(second, command === L ? now : last)

            if (i === len) {
                const path = ui.__.__pathForRender = clonePathForArrow ? [...data] : data
                const pathForArrow: IPathCommandData = ui.__.__pathForArrow = []

                if (useStartArrow) {
                    const startArrowPath = getArrowPath(ui, startArrow, second, first, strokeWidth, connectPoint, !!dashPattern)
                    dashPattern ? pathForArrow.push(...startArrowPath) : path.push(...startArrowPath)

                    if (connectPoint.x) {
                        getDistancePoint(first, second, -connectPoint.x, true)
                        path[1] = second.x
                        path[2] = second.y
                    }
                }

                if (endArrow && endArrow !== 'none') {
                    const endArrowPath = getArrowPath(ui, endArrow, last, now, strokeWidth, connectPoint, !!dashPattern)
                    dashPattern ? pathForArrow.push(...endArrowPath) : path.push(...endArrowPath)

                    if (connectPoint.x) {
                        getDistancePoint(now, last, -connectPoint.x, true)
                        let index: number
                        switch (command) {
                            case L:  //lineto(x, y)
                                index = i - 3 + 1
                                break
                            case C:  //bezierCurveTo(x1, y1, x2, y2, x, y)
                                index = i - 7 + 5
                                break
                            case Q:  //quadraticCurveTo(x1, y1, x, y)
                                index = i - 5 + 3
                                break
                            case U: // arcTo(x1, y1, x2, y2, radius)
                                index = i - 6 + 3
                                break
                        }
                        if (index) setPoint(path, last, index)
                    }
                }

            } else {
                copy(last, now)
            }
        }


    },

    register(name: string, data: IPathDataArrow): void {
        this.list[name] = data
    },

    get(name: string): IPathDataArrow {
        return this.list[name]
    }

}



function copyPoints(data: IPathCommandData, from: IPointData, to: IPointData, startIndex: number): void {
    copyFrom(from, data[startIndex], data[startIndex + 1])
    copyFrom(to, data[startIndex + 2], data[startIndex + 3])
}

function setPoint(data: IPathCommandData, point: IPointData, startIndex: number): void {
    data[startIndex] = point.x
    data[startIndex + 1] = point.y
}