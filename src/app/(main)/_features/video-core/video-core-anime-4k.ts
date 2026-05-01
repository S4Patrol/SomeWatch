import { vc_anime4kManager } from "@/app/(main)/_features/video-core/video-core"
import type { Anime4KOption } from "@/app/(main)/_features/video-core/video-core-anime-4k-manager"
import { vc_realVideoSize } from "@/app/(main)/_features/video-core/video-core-atoms"
import { vc_seeking } from "@/app/(main)/_features/video-core/video-core-atoms"
import { vc_paused } from "@/app/(main)/_features/video-core/video-core-atoms"
import { vc_miniPlayer } from "@/app/(main)/_features/video-core/video-core-atoms"
import { vc_videoElement } from "@/app/(main)/_features/video-core/video-core-atoms"
import { vc_pip } from "@/app/(main)/_features/video-core/video-core-pip"
import { logger } from "@/lib/helpers/debug"
import { useAtomValue } from "jotai"
import { useAtom } from "jotai/react"
import { atomWithStorage } from "jotai/utils"
import React from "react"

const log = logger("VIDEO CORE ANIME 4K")

export const vc_anime4kOption = atomWithStorage<Anime4KOption>("sea-video-core-anime4k", "off", undefined, { getOnInit: true })

export const VideoCoreAnime4K = () => {
    const realVideoSize = useAtomValue(vc_realVideoSize)
    const seeking = useAtomValue(vc_seeking)
    const isMiniPlayer = useAtomValue(vc_miniPlayer)
    const isPip = useAtomValue(vc_pip)
    const video = useAtomValue(vc_videoElement)
    const paused = useAtomValue(vc_paused)

    const manager = useAtomValue(vc_anime4kManager)
    const [selectedOption] = useAtom(vc_anime4kOption)

    // Update manager with real video size
    React.useEffect(() => {
        if (manager) {
            manager.updateCanvasSize({ width: video?.videoWidth || 0, height: video?.videoHeight || 0 })
        }
    }, [manager, video])

    // Handle option changes
    React.useEffect(() => {
        if (video && manager) {
            // log.info("Setting Anime4K option", selectedOption)
            manager.setOption(selectedOption, {
                isMiniPlayer,
                isPip,
                seeking,
            })
        }
    }, [video, manager, selectedOption, isMiniPlayer, isPip, seeking])

    // Handle option changes
    React.useLayoutEffect(() => {
        if (video && manager) {
            manager.resize(realVideoSize.width, realVideoSize.height)
        }
    }, [realVideoSize])

    return null
}

export const anime4kOptions: { value: Anime4KOption; label: string; description: string; performance: "light" | "medium" | "heavy" }[] = [
    { value: "off", label: "Kapalı", description: "Görüntü iyileştirme devre dışı", performance: "light" },
    { value: "css-enhance", label: "Hafif İyileştirme", description: "Tüm ekran kartlarında çalışan temel görüntü iyileştirmesi", performance: "light" },
    { value: "mode-a", label: "Temel İyileştirme", description: "Sıkıştırma bozulmalarını giderir ve yükseltir", performance: "light" },
    { value: "mode-b", label: "Yumuşak İyileştirme", description: "Hafif hata giderimi ve yükseltme", performance: "light" },
    { value: "mode-c", label: "Gürültü Azaltıcı", description: "Gürültüleri temizleyerek keskinleştirir", performance: "light" },
    { value: "mode-aa", label: "Gelişmiş Temel (A+A)", description: "Daha iyi kalite için artırılmış restorasyon", performance: "medium" },
    { value: "mode-bb", label: "Gelişmiş Yumuşak (B+B)", description: "Çift katmanlı yumuşak restorasyon", performance: "medium" },
    { value: "mode-ca", label: "Karma Temizleme (C+A)", description: "Gürültü azaltma ve restorasyon karması", performance: "medium" },
    { value: "cnn-2x-medium", label: "Dengeli Yapay Zeka", description: "Hız ve kalite dengesi sunan yükseltme (2x)", performance: "medium" },
    { value: "cnn-2x-very-large", label: "Yüksek Kalite YZ", description: "Yüksek kaliteli yapay zeka yükseltmesi (2x)", performance: "heavy" },
    { value: "denoise-cnn-2x-very-large", label: "Gürültüsüz Yüksek YZ", description: "Yükseltirken gürültüleri de yok eder (2x)", performance: "heavy" },
    { value: "cnn-2x-ultra-large", label: "Maksimum Kalite YZ", description: "En yüksek kalite CNN yükseltmesi (2x)", performance: "heavy" },
    { value: "gan-3x-large", label: "Gelişmiş GAN (3x)", description: "Algısal kalite için üretken yapay zeka", performance: "heavy" },
    { value: "gan-4x-ultra-large", label: "Ultra Kalite GAN (4x)", description: "Maksimum GAN destekli yükseltme", performance: "heavy" },
]

export const getAnime4KOptionByValue = (value: Anime4KOption) => {
    return anime4kOptions.find(option => option.value === value)
}

export const getRecommendedAnime4KOptions = (videoResolution: { width: number; height: number }) => {
    const is720pOrLower = videoResolution.height <= 720
    const is1080pOrLower = videoResolution.height <= 1080

    if (is720pOrLower) {
        return anime4kOptions.filter(option =>
            ["mode-a", "mode-b", "mode-aa", "mode-bb", "cnn-2x-medium", "cnn-2x-very-large"].includes(option.value),
        )
    } else if (is1080pOrLower) {
        return anime4kOptions.filter(option =>
            ["mode-a", "mode-b", "mode-c", "cnn-2x-medium"].includes(option.value),
        )
    } else {
        return anime4kOptions.filter(option =>
            ["mode-a", "mode-b", "mode-c"].includes(option.value),
        )
    }
}

export const getPerformanceRecommendation = (gpu?: string) => {
    const isHighEnd = gpu && (
        gpu.includes("RTX 40") ||
        gpu.includes("RTX 3080") ||
        gpu.includes("RTX 3090") ||
        gpu.includes("RX 6800") ||
        gpu.includes("RX 6900") ||
        gpu.includes("M1 Pro") ||
        gpu.includes("M1 Max") ||
        gpu.includes("M2") ||
        gpu.includes("M3")
    )

    const isMidRange = gpu && (
        gpu.includes("RTX 30") ||
        gpu.includes("RTX 20") ||
        gpu.includes("GTX 16") ||
        gpu.includes("RX 6600") ||
        gpu.includes("RX 5") ||
        gpu.includes("M1")
    )

    if (isHighEnd) {
        return {
            maxPerformance: "heavy" as const,
            recommendedOptions: anime4kOptions.filter(opt => opt.performance !== "heavy").slice(0, 8),
        }
    } else if (isMidRange) {
        return {
            maxPerformance: "medium" as const,
            recommendedOptions: anime4kOptions.filter(opt => opt.performance === "light" || opt.performance === "medium"),
        }
    } else {
        return {
            maxPerformance: "light" as const,
            recommendedOptions: anime4kOptions.filter(opt => opt.performance === "light"),
        }
    }
}

export const isWebGPUAvailable = async (): Promise<boolean> => {
    if (!navigator.gpu) {
        return false
    }

    try {
        const adapter = await navigator.gpu.requestAdapter()
        if (!adapter) return false

        const device = await adapter.requestDevice()
        return !!device
    }
    catch {
        return false
    }
}

export const getOptimalAnime4KSettings = async (videoResolution: { width: number; height: number }) => {
    const webGPUAvailable = await isWebGPUAvailable()

    if (!webGPUAvailable) {
        return {
            supported: false,
            recommendation: "off" as Anime4KOption,
            reason: "WebGPU not supported on this device",
        }
    }

    const gpuInfo = await getGPUInfo()
    const recommendation = getPerformanceRecommendation(gpuInfo?.gpu)
    const videoRecommendations = getRecommendedAnime4KOptions(videoResolution)

    const optimalOption = anime4kOptions.find(option =>
        videoRecommendations.some(vr => vr.value === option.value) &&
        recommendation.recommendedOptions.some(pr => pr.value === option.value),
    )

    return {
        supported: true,
        recommendation: optimalOption?.value || "mode-a" as Anime4KOption,
        reason: `Recommended for ${videoResolution.height}p video on ${gpuInfo?.gpu || "current GPU"}`,
        alternatives: recommendation.recommendedOptions.slice(0, 3),
    }
}

const getGPUInfo = async () => {
    if (!navigator.gpu) return null

    try {
        const adapter = await navigator.gpu.requestAdapter()
        if (!adapter) return null

        const info = (adapter as any).info || {}

        return {
            gpu: info.vendor || info.architecture || "Unknown GPU",
            vendor: info.vendor || "Unknown",
        }
    }
    catch {
        return null
    }
}

