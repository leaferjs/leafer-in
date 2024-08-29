import { ILeaferCanvas, IRenderOptions, ILeaferImage, IRobot, IRobotData, IRobotInputData, IRobotKeyframe, IRobotActions, IRobotActionName, IRobotComputedKeyframe } from '@leafer-ui/interface'
import { UI, registerUI, dataProcessor, ImageEvent, surfaceType, ImageManager, dataType, boundsType } from '@leafer-ui/draw'

import { RobotData } from './data/RobotData'


@registerUI()
export class Robot extends UI implements IRobot {

    public get __tag() { return 'Robot' }

    public running: boolean

    public get nowFrame(): IRobotComputedKeyframe { return this.robotFrames && this.robotFrames[this.now] }

    public robotFrames?: IRobotComputedKeyframe[]


    @dataProcessor(RobotData)
    declare public __: IRobotData

    @boundsType()
    public robot?: IRobotKeyframe | IRobotKeyframe[]

    @dataType()
    public actions?: IRobotActions

    @dataType('')
    public action?: IRobotActionName

    @surfaceType(0)
    public now?: number

    @dataType(12)
    public FPS?: number

    @dataType(true)
    public loop?: boolean


    protected __timer: any


    constructor(data?: IRobotInputData) {
        super(data)
        this.__.__drawAfterFill = true
    }


    public play(): void {
        this.running = true
    }

    public pause(): void {
        this.running = false
    }

    public stop(): void {
        this.pause()
    }


    public __updateRobot(): void {
        const { robot } = this
        this.robotFrames = []
        if (!robot) return

        let start = 0
        if (robot instanceof Array) robot.forEach(frame => this.__loadRobot(frame, start, start += frame.total || 1))
        else this.__loadRobot(robot, 0, robot.total)
    }

    public __updateAction(): void {
        const action = this.actions[this.action]

        this.stop()

        if (this.__timer) clearTimeout(this.__timer)
        if (action === undefined) return

        if (typeof action === 'number') {

            this.now = action

        } else if (action instanceof Array) {

            const { length } = action
            if (length > 1) {
                const start = this.now = action[0], end = action[action.length - 1]
                this.play()
                this.__runAction(start, end)
            } else if (length) this.now = action[0]

        }
    }


    protected __loadRobot(frame: IRobotKeyframe, start: number, end: number): void {
        for (let i = start; i < end; i++) this.robotFrames.push(undefined)

        const image = ImageManager.get(frame)
        if (image.ready) this.__createFrames(image, frame, start, end)
        else image.load(() => this.__createFrames(image, frame, start, end))
    }

    protected __createFrames(image: ILeaferImage, frame: IRobotKeyframe, start: number, end: number): void {
        const { offset, size, total } = frame
        const { width, height } = size && (typeof size === 'number' ? { width: size, height: size } : size) || (total > 1 ? this : image)

        let x = offset ? offset.x : 0, y = offset ? offset.y : 0

        for (let i = start; i < end; i++) {
            this.robotFrames[i] = { view: image.view, x, y, width, height }
            if (x + width >= image.width) x = 0, y += height
            else x += width
        }

        this.__updateRobotBounds()
        this.forceRender()
        this.emitEvent(new ImageEvent(ImageEvent.LOADED, { image }))
    }


    protected __runAction(start: number, end: number): void {
        this.__timer = setTimeout(() => {
            if (this.running) {
                if (this.now === end) this.now = start
                else this.now++
                this.__updateRobotBounds()
            }

            this.__runAction(start, end)
        }, 1000 / this.FPS)
    }

    protected __updateRobotBounds(): void {
        const { nowFrame } = this
        if (nowFrame) {
            const data = this.__
            const width = nowFrame.width / data.pixelRatio
            const height = nowFrame.height / data.pixelRatio
            if (data.width !== width || data.height !== height) this.forceUpdate('width')

            data.__naturalWidth = width
            data.__naturalHeight = height
        }
    }

    public __drawAfterFill(canvas: ILeaferCanvas, _options: IRenderOptions): void {
        const { nowFrame } = this
        if (nowFrame) {
            const { width, height, cornerRadius } = this.__
            if (cornerRadius || this.pathInputed) {
                canvas.save()
                canvas.clip()
                canvas.drawImage(nowFrame.view, nowFrame.x, nowFrame.y, nowFrame.width, nowFrame.height, 0, 0, width, height)
                canvas.restore()
            } else {
                canvas.drawImage(nowFrame.view, nowFrame.x, nowFrame.y, nowFrame.width, nowFrame.height, 0, 0, width, height)
            }
        }
    }

    public destroy(): void {
        if (this.robotFrames) this.robotFrames = null
        super.destroy()
    }

}