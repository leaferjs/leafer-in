import { Platform, Plugin } from '@leafer-ui/draw'


Plugin.add('bg-runner')

export const BackgroundRunner = {
    disabled: false, // 是否禁用后台渲染
    maxFPS: 60 // 背景运行的帧率
}


type RenderCallback = (timestamp: number) => void

let renderQueue: RenderCallback[] = []

// 前后台状态
let isRafScheduled = false      // 是否已调度 requestAnimationFrame
let isTimeoutScheduled = false  // 是否已调度 setTimeout
let workerRunning = false       // Worker 内部定时器是否在运行
let backgroundWorker: Worker | null = null

function runRenderQueue(timestamp: number) {
    const queue = renderQueue.splice(0)
    for (const item of queue) item(timestamp)
}

// 前台运行：使用 requestAnimationFrame
function onForeground() {
    if (!isRafScheduled) {
        isRafScheduled = true
        window.requestAnimationFrame((timestamp) => {
            isRafScheduled = false
            runRenderQueue(timestamp)

            // 如果队列中还有任务，继续调度
            if (renderQueue.length) onForeground()
        })
    }

    // 前台时暂停 Worker 定时器
    if (backgroundWorker && workerRunning) {
        backgroundWorker.postMessage({ action: 'stop' })
        workerRunning = false
    }
}

// 后台运行：使用 Worker（优先）或 setTimeout（降级）
function onBackground() {
    if (backgroundWorker) {

        //  移除 isWorkerScheduled，改为用 workerRunning 控制
        if (!workerRunning) {
            backgroundWorker.postMessage({ action: 'start', interval: 1000 / BackgroundRunner.maxFPS }) // 16ms ≈ 60fps
            workerRunning = true
        }

    } else {
        // Worker 不可用时的降级方案
        if (!isTimeoutScheduled) {
            isTimeoutScheduled = true
            setTimeout(() => {
                isTimeoutScheduled = false

                // 统一时间源，避免 rAF / Date.now 混乱
                runRenderQueue(performance.now())

                // 如果队列还有任务，继续后台调度
                if (renderQueue.length) onBackground()

            }, 1000 / BackgroundRunner.maxFPS)
        }
    }
}

// 前后台切换调度
function requestRender() {
    if (BackgroundRunner.disabled || !document.hidden) {
        // 前台：requestAnimationFrame
        onForeground()
    } else {
        // 后台：Worker 或 setTimeout
        if (!backgroundWorker && typeof Worker !== 'undefined') {

            backgroundWorker = new Worker(
                URL.createObjectURL(
                    new Blob(
                        [`
                            let timerId = null
                            self.onmessage = e => {
                                if (e.data.action === 'start') {
                                    if (!timerId) {
                                        timerId = setInterval(() => postMessage(performance.now()), e.data.interval || 16)
                                    }
                                } else if (e.data.action === 'stop') {
                                    if (timerId) {
                                        clearInterval(timerId)
                                        timerId = null
                                    }
                                }
                            }
                        `],
                        { type: 'application/javascript' }
                    )
                )
            )

            backgroundWorker.onmessage = (e) => {
                runRenderQueue(e.data) // 使用 Worker 传来的时间戳

                //  队列为空时主动停止 Worker，避免空转
                if (!renderQueue.length && workerRunning) {
                    backgroundWorker!.postMessage({ action: 'stop' })
                    workerRunning = false
                }
            }
        }

        onBackground()
    }
}

document.addEventListener('visibilitychange', requestRender)

Platform.requestRender = function (render: RenderCallback) {
    renderQueue.push(render)
    requestRender()
}