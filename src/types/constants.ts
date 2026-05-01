export const __isElectronDesktop__ = import.meta.env.SEA_PUBLIC_DESKTOP === "electron" || (typeof window !== "undefined" && navigator.userAgent.includes("Electron"))
export const __isDesktop__ = import.meta.env.SEA_PUBLIC_PLATFORM === "desktop" || __isElectronDesktop__
export const HIDE_IMAGES = false

export const __CAST_ENABLED__ = false

