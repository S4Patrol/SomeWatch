import { atomWithStorage } from "jotai/utils"
import { useAtomValue } from "jotai"
import { useAtom } from "jotai/react"
import React from "react"
import { vc_videoElement, vc_miniPlayer, vc_seeking, vc_realVideoSize } from "./video-core-atoms"
import { vc_pip } from "./video-core-pip"
import { logger } from "@/lib/helpers/debug"
import { vc_frameGenManager, vc_anime4kManager } from "./video-core"
import { FrameGenOption } from "./video-core-frame-gen-manager"

const log = logger("VIDEO CORE FRAME GEN")

export const vc_frameGenOption = atomWithStorage<FrameGenOption>("sea-video-core-frame-gen", "off", undefined, { getOnInit: true })

export const frameGenOptions: { value: FrameGenOption; label: string; description: string }[] = [
    { value: "off", label: "Kapalı", description: "Orijinal kare hızı" },
    { value: "45fps", label: "45 FPS", description: "Akıcı" },
    { value: "60fps", label: "60 FPS", description: "Çok Akıcı" },
    { value: "120fps", label: "120 FPS", description: "Ultra Akıcı" },
    { value: "144fps", label: "144 FPS", description: "Maksimum Akıcılık" },
    { value: "165fps", label: "165 FPS", description: "Aşırı Akıcılık" },
]

export const VideoCoreFrameGen = () => {
    const realVideoSize = useAtomValue(vc_realVideoSize)
    const seeking = useAtomValue(vc_seeking)
    const isMiniPlayer = useAtomValue(vc_miniPlayer)
    const isPip = useAtomValue(vc_pip)
    const video = useAtomValue(vc_videoElement)

    const manager = useAtomValue(vc_frameGenManager)
    const anime4kManager = useAtomValue(vc_anime4kManager)
    const [selectedOption] = useAtom(vc_frameGenOption)

    // Forward the Anime4K canvas to the Frame Gen manager so it can draw from it
    React.useEffect(() => {
        if (manager) {
            manager.setAnime4kCanvas(anime4kManager?.canvas ?? null)
        }
    }, [manager, anime4kManager, anime4kManager?.canvas])

    React.useEffect(() => {
        if (manager) {
            manager.updateCanvasSize({ width: video?.videoWidth || 0, height: video?.videoHeight || 0 })
        }
    }, [manager, video])

    React.useEffect(() => {
        if (video && manager) {
            manager.setOption(selectedOption, {
                isMiniPlayer,
                isPip,
                seeking,
            })
        }
    }, [video, manager, selectedOption, isMiniPlayer, isPip, seeking])

    React.useLayoutEffect(() => {
        if (video && manager) {
            manager.resize(realVideoSize.width, realVideoSize.height)
        }
    }, [realVideoSize])

    return null
}
