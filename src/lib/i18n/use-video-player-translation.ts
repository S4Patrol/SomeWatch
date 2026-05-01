import { videoPlayerTR, VideoPlayerTranslation } from "./video-player-tr"

// Şu an sadece Türkçe, ileride daha fazla dil eklenebilir
const translations: Record<string, VideoPlayerTranslation> = {
    tr: videoPlayerTR,
}

// Varsayılan dil Türkçe
const currentLanguage = "tr"

export function useVideoPlayerTranslation() {
    return translations[currentLanguage]
}

// Hook kullanmadan direkt erişim için
export function getVideoPlayerTranslation() {
    return translations[currentLanguage]
}
