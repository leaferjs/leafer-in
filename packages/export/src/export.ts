import { IExportModule, IExportOptions, IExportResult, IExportResultFunction, IUI, IExportFileType, IFunction, IRenderOptions, IBoundsData, IBounds, ILocationType, ILeaf, IPointData } from '@leafer-ui/interface'
import { Creator, Matrix, TaskProcessor, FileHelper, Bounds, Platform, MathHelper, Resource, Export, isUndefined } from '@leafer-ui/draw'

import { getTrimBounds } from './trim'


export const ExportModule: IExportModule = {

    syncExport(leaf: IUI, filename: string, options?: IExportOptions | number | boolean): IExportResult {

        Export.running = true

        let result: IExportResult

        try {

            const fileType = FileHelper.fileType(filename)
            const isDownload = filename.includes('.')
            options = FileHelper.getExportOptions(options)

            const { toURL } = Platform
            const { download } = Platform.origin


            if (fileType === 'json') {

                isDownload && download(toURL(JSON.stringify(leaf.toJSON(options.json)), 'text'), filename)
                result = { data: isDownload ? true : leaf.toJSON(options.json) }

            } else if (fileType === 'svg') {

                isDownload && download(toURL(leaf.toSVG(), 'svg'), filename)
                result = { data: isDownload ? true : leaf.toSVG() }

            } else {

                let renderBounds: IBoundsData, trimBounds: IBounds, scaleX = 1, scaleY = 1
                const { worldTransform, isLeafer, leafer, isFrame } = leaf
                const { slice, clip, trim, screenshot, padding, onCanvas } = options
                const smooth = isUndefined(options.smooth) ? (leafer ? leafer.config.smooth : true) : options.smooth
                const contextSettings = options.contextSettings || (leafer ? leafer.config.contextSettings : undefined)

                const fill = (isLeafer && screenshot) ? (isUndefined(options.fill) ? leaf.fill : options.fill) : options.fill // leafer use 
                const needFill = FileHelper.isOpaqueImage(filename) || fill, matrix = new Matrix()

                // 获取元素大小
                if (screenshot) {
                    renderBounds = screenshot === true ? (isLeafer ? leafer.canvas.bounds : leaf.worldRenderBounds) : screenshot
                } else {
                    let relative: ILocationType | ILeaf = options.relative || (isLeafer ? 'inner' : 'local')

                    scaleX = worldTransform.scaleX
                    scaleY = worldTransform.scaleY

                    switch (relative) {
                        case 'inner':
                            matrix.set(worldTransform)
                            break
                        case 'local':
                            matrix.set(worldTransform).divide(leaf.localTransform)
                            scaleX /= leaf.scaleX
                            scaleY /= leaf.scaleY
                            break
                        case 'world':
                            scaleX = 1
                            scaleY = 1
                            break
                        case 'page':
                            relative = leafer || leaf
                        default:
                            matrix.set(worldTransform).divide(leaf.getTransform(relative))
                            const l = relative.worldTransform
                            scaleX /= scaleX / l.scaleX
                            scaleY /= scaleY / l.scaleY
                    }

                    renderBounds = leaf.getBounds('render', relative)
                }


                // 缩放元素
                const scaleData = { scaleX: 1, scaleY: 1 }
                MathHelper.getScaleData(options.scale, options.size, renderBounds, scaleData)

                let pixelRatio = options.pixelRatio || 1


                // 导出元素
                let { x, y, width, height } = new Bounds(renderBounds).scale(scaleData.scaleX, scaleData.scaleY)
                if (clip) {
                    x += clip.x, y += clip.y, width = clip.width, height = clip.height
                    if (clip.rotation) matrix.rotateOfInner({ x, y }, -clip.rotation)
                }

                const renderOptions: IRenderOptions = { exporting: true, matrix: matrix.scale(1 / scaleData.scaleX, 1 / scaleData.scaleY).invert().translate(-x, -y).withScale(1 / scaleX * scaleData.scaleX, 1 / scaleY * scaleData.scaleY) }
                let canvas = Creator.canvas({ width: Math.floor(width), height: Math.floor(height), pixelRatio, smooth, contextSettings })

                let sliceLeaf: IUI
                if (slice) {
                    sliceLeaf = leaf
                    sliceLeaf.__worldOpacity = 0 // hide slice

                    leaf = leafer || leaf // render all in bounds
                    renderOptions.bounds = canvas.bounds
                }


                canvas.save()


                const igroneFill = isFrame && !isUndefined(fill), oldFill = leaf.get('fill')
                if (igroneFill) leaf.fill = ''

                Platform.render(leaf, canvas, renderOptions)

                if (igroneFill) leaf.fill = oldFill as string


                canvas.restore()

                if (sliceLeaf) sliceLeaf.__updateWorldOpacity() // show slice

                if (trim) {
                    trimBounds = getTrimBounds(canvas)
                    const old = canvas, { width, height } = trimBounds
                    const config = { x: 0, y: 0, width, height, pixelRatio }

                    canvas = Creator.canvas(config)
                    canvas.copyWorld(old, trimBounds, config)
                    old.destroy()
                }

                if (padding) {
                    const [top, right, bottom, left] = MathHelper.fourNumber(padding)
                    const old = canvas, { width, height } = old

                    canvas = Creator.canvas({ width: width + left + right, height: height + top + bottom, pixelRatio })
                    canvas.copyWorld(old, old.bounds, { x: left, y: top, width, height })
                    old.destroy()
                }

                if (needFill) canvas.fillWorld(canvas.bounds, fill || '#FFFFFF', 'destination-over')
                if (onCanvas) onCanvas(canvas)

                const data = filename === 'canvas' ? canvas : canvas.export(filename, options)
                result = { data, width: canvas.pixelWidth, height: canvas.pixelHeight, renderBounds, trimBounds }

                // 及时清理缓存画布
                const app = leafer && leafer.app
                if (app && app.canvasManager) app.canvasManager.clearRecycled()

            }

        } catch (error) {

            result = { data: '', error }
        }

        Export.running = false

        return result
    },

    export(leaf: IUI, filename: IExportFileType | string, options?: IExportOptions | number | boolean): Promise<IExportResult> {

        Export.running = true

        return addTask((success: IExportResultFunction) =>

            new Promise((resolve: IFunction) => {

                const getResult = async () => {
                    if (!Resource.isComplete) return Platform.requestRender(getResult)
                    const result: IExportResult = Export.syncExport(leaf, filename, options)
                    if (result.data instanceof Promise) result.data = await result.data
                    success(result)
                    resolve()
                }

                leaf.updateLayout()
                checkLazy(leaf)

                const { leafer } = leaf
                if (leafer) leafer.waitViewCompleted(getResult)
                else getResult()

            })

        )

    }

}


let tasker: TaskProcessor

function addTask(task: IFunction): Promise<IExportResult> {
    if (!tasker) tasker = new TaskProcessor()

    return new Promise((resolve: IExportResultFunction) => {
        tasker.add(async () => await task(resolve), { parallel: false })
    })
}


function checkLazy(leaf: IUI): void {
    if (leaf.__.__needComputePaint) leaf.__.__computePaint()
    if (leaf.isBranch) leaf.children.forEach(child => checkLazy(child))
}