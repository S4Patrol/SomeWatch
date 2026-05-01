import { logger } from "@/lib/helpers/debug"

const log = logger("VIDEO CORE FRAME GEN MANAGER")

export type FrameGenOption = "off" | "45fps" | "60fps" | "120fps" | "144fps" | "165fps"

export class VideoCoreFrameGenManager extends EventTarget {
    canvas: HTMLCanvasElement | null = null
    ctx: CanvasRenderingContext2D | null = null
    private readonly videoElement: HTMLVideoElement
    private _currentOption: FrameGenOption = "off"
    private _boxSize: { width: number; height: number } = { width: 0, height: 0 }
    private _initialized = false
    private _renderLoopId: number | null = null
    private _targetFps: number = 60
    // Track the last time we grabbed a "real" frame from the video source
    private _lastVideoTime: number = -1
    // Off-screen canvas holds the previous real frame for blending
    private _prevFrameCanvas: HTMLCanvasElement | null = null
    private _prevFrameCtx: CanvasRenderingContext2D | null = null
    // Reference to the anime4k canvas so we can draw from it when active
    private _anime4kCanvas: HTMLCanvasElement | null = null

    constructor({ videoElement }: { videoElement: HTMLVideoElement }) {
        super()
        this.videoElement = videoElement
        log.info("Frame Generation manager initialized")
    }

    getCurrentOption(): FrameGenOption {
        return this._currentOption
    }

    /** Optional: provide the Anime4K canvas so frame gen can draw from it */
    setAnime4kCanvas(canvas: HTMLCanvasElement | null) {
        this._anime4kCanvas = canvas
    }

    updateCanvasSize(_size: { width: number; height: number }) {
        const rect = this.videoElement.getBoundingClientRect()
        this.resize(rect.width, rect.height)
    }

    resize(containerWidth: number, containerHeight: number) {
        const videoContentSize = this.getRenderedVideoContentSize(this.videoElement, containerWidth, containerHeight)
        if (!videoContentSize) return

        const newW = Math.round(videoContentSize.displayedWidth)
        const newH = Math.round(videoContentSize.displayedHeight)

        if (newW === 0 || newH === 0) return
        if (newW === this._boxSize.width && newH === this._boxSize.height) return

        this._boxSize = { width: newW, height: newH }

        if (this.canvas) {
            this.canvas.width = newW
            this.canvas.height = newH
            this.canvas.style.width = newW + "px"
            this.canvas.style.height = newH + "px"
        }

        // Resize prev-frame buffer too
        if (this._prevFrameCanvas) {
            this._prevFrameCanvas.width = newW
            this._prevFrameCanvas.height = newH
        }
    }

    async setOption(option: FrameGenOption, state?: { isMiniPlayer: boolean; isPip: boolean; seeking: boolean }) {
        const previousOption = this._currentOption
        this._currentOption = option

        if (option === "off") {
            this.destroy()
            return
        }

        if (state) {
            if (state.isMiniPlayer || state.isPip) {
                if (previousOption !== "off") this.destroy()
                return
            }
            if (state.seeking) {
                this._hideCanvas()
                return
            }
        }

        if (this._boxSize.width === 0 || this._boxSize.height === 0) {
            // Try to get the size now
            const rect = this.videoElement.getBoundingClientRect()
            this.resize(rect.width, rect.height)
        }

        if (this._boxSize.width === 0 || this._boxSize.height === 0) return

        if (this.canvas && this._isCanvasHidden()) {
            this._showCanvas()
        }

        this._setTargetFps(option)

        if (previousOption !== option || !this.canvas) {
            if (previousOption !== "off") this.destroy()
            this._initialize()
        }
    }

    private _setTargetFps(option: FrameGenOption) {
        switch (option) {
            case "45fps":  this._targetFps = 45;  break
            case "60fps":  this._targetFps = 60;  break
            case "120fps": this._targetFps = 120; break
            case "144fps": this._targetFps = 144; break
            case "165fps": this._targetFps = 165; break
            default:       this._targetFps = 60;  break
        }
    }

    destroy() {
        this._initialized = false
        if (this._renderLoopId) {
            cancelAnimationFrame(this._renderLoopId)
            this._renderLoopId = null
        }
        // Remove the canvas we injected but do NOT touch the video element visibility
        // (Anime4K or the plain video player manages that)
        if (this.canvas) {
            this.canvas.remove()
            this.canvas = null
            this.ctx = null
        }
        if (this._prevFrameCanvas) {
            this._prevFrameCanvas = null
            this._prevFrameCtx = null
        }
        this._lastVideoTime = -1
    }

    private _initialize() {
        if (this._initialized || this._currentOption === "off") return
        log.info("Initializing Frame Generation", this._currentOption)
        this._createCanvas()
        this._createPrevFrameBuffer()
        this._startRendering()
        this._initialized = true
    }

    private getRenderedVideoContentSize(video: HTMLVideoElement, containerWidth: number, containerHeight: number) {
        const videoWidth = video.videoWidth
        const videoHeight = video.videoHeight
        if (!videoWidth || !videoHeight) return null

        const containerRatio = containerWidth / containerHeight
        const videoRatio = videoWidth / videoHeight
        let displayedWidth, displayedHeight

        if (videoRatio > containerRatio) {
            displayedWidth = containerWidth
            displayedHeight = containerWidth / videoRatio
        } else {
            displayedHeight = containerHeight
            displayedWidth = containerHeight * videoRatio
        }
        return { displayedWidth, displayedHeight }
    }

    private _createCanvas() {
        const rect = this.videoElement.getBoundingClientRect()
        const videoContentSize = this.getRenderedVideoContentSize(this.videoElement, rect.width, rect.height)
        if (videoContentSize) {
            this._boxSize = {
                width: Math.round(videoContentSize.displayedWidth),
                height: Math.round(videoContentSize.displayedHeight),
            }
        }

        this.canvas = document.createElement("canvas")
        this.canvas.width = this._boxSize.width
        this.canvas.height = this._boxSize.height
        this.canvas.style.objectFit = "contain"
        this.canvas.style.position = "absolute"
        this.canvas.style.pointerEvents = "none"
        // Place above Anime4K canvas (z-index 2) but below UI controls
        this.canvas.style.zIndex = "4"
        this.canvas.style.width = this._boxSize.width + "px"
        this.canvas.style.height = this._boxSize.height + "px"
        this.canvas.className = "vc-frame-gen-canvas"

        // Use willReadFrequently=false for best GPU path; desynchronized for lower latency
        this.ctx = this.canvas.getContext("2d", { alpha: false, desynchronized: true }) as CanvasRenderingContext2D

        // Insert the canvas into the same container as the video element
        // (video's parent is the VideoCore container div)
        const parent = this.videoElement.parentElement
        if (parent) {
            parent.appendChild(this.canvas)
        }
    }

    private _createPrevFrameBuffer() {
        this._prevFrameCanvas = document.createElement("canvas")
        this._prevFrameCanvas.width = this._boxSize.width
        this._prevFrameCanvas.height = this._boxSize.height
        this._prevFrameCtx = this._prevFrameCanvas.getContext("2d", { alpha: false }) as CanvasRenderingContext2D
    }

    /** Get the source element to draw from: Anime4K canvas if active, else the video element */
    private _getDrawSource(): HTMLVideoElement | HTMLCanvasElement {
        if (this._anime4kCanvas && this._anime4kCanvas.isConnected && this._anime4kCanvas.width > 0) {
            return this._anime4kCanvas
        }
        return this.videoElement
    }

    private _startRendering() {
        if (!this.canvas || !this.videoElement || this._currentOption === "off") return
        log.info("Frame Generation rendering started at", this._targetFps, "fps")

        const targetInterval = 1000 / this._targetFps
        let lastFrameTime = 0
        let lastBlendTime = 0
        const blendInterval = targetInterval // same rate for blended frames

        const renderLoop = (now: number) => {
            if (!this.canvas || !this.ctx || this._currentOption === "off") {
                this._renderLoopId = requestAnimationFrame(renderLoop)
                return
            }

            const source = this._getDrawSource()
            const videoTime = this.videoElement.currentTime
            const isPlaying = !this.videoElement.paused && !this.videoElement.ended

            // --- Capture a new "real" frame when the video actually advanced ---
            if (videoTime !== this._lastVideoTime) {
                this._lastVideoTime = videoTime

                // Store this frame in our previous-frame buffer
                if (this._prevFrameCtx && this._prevFrameCanvas) {
                    this._prevFrameCtx.drawImage(source, 0, 0, this._prevFrameCanvas.width, this._prevFrameCanvas.height)
                }

                // Draw the real frame directly to output canvas
                if (this._boxSize.width > 0 && this._boxSize.height > 0) {
                    this.ctx.globalAlpha = 1.0
                    this.ctx.drawImage(source, 0, 0, this.canvas.width, this.canvas.height)
                }

                lastFrameTime = now
                lastBlendTime = now
            } else if (isPlaying && this._prevFrameCanvas && this._prevFrameCtx) {
                // Video hasn't changed yet — inject a blended "in-between" frame
                const elapsed = now - lastBlendTime
                if (elapsed >= blendInterval) {
                    lastBlendTime = now
                    // Draw previous frame fully, then overlay current source at low alpha
                    // This creates a ghost/afterimage interpolation effect
                    this.ctx.globalAlpha = 1.0
                    this.ctx.drawImage(this._prevFrameCanvas, 0, 0, this.canvas.width, this.canvas.height)
                    // Add a subtle forward-blur of the live source
                    this.ctx.globalAlpha = 0.35
                    this.ctx.drawImage(source, 0, 0, this.canvas.width, this.canvas.height)
                    this.ctx.globalAlpha = 1.0
                }
            }

            this._renderLoopId = requestAnimationFrame(renderLoop)
        }

        this._renderLoopId = requestAnimationFrame(renderLoop)
    }

    private _hideCanvas() {
        if (this.canvas) this.canvas.style.display = "none"
    }

    private _showCanvas() {
        if (this.canvas) this.canvas.style.display = "block"
    }

    private _isCanvasHidden(): boolean {
        return this.canvas ? this.canvas.style.display === "none" : false
    }
}
