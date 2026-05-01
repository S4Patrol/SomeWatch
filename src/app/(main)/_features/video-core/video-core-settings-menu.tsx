import { useOpenInExplorer } from "@/api/hooks/explorer.hooks"
import { vc_subtitleManager } from "@/app/(main)/_features/video-core/video-core"
import { vc_mediaCaptionsManager } from "@/app/(main)/_features/video-core/video-core"
import { anime4kOptions, getAnime4KOptionByValue, vc_anime4kOption } from "@/app/(main)/_features/video-core/video-core-anime-4k"
import { Anime4KOption } from "@/app/(main)/_features/video-core/video-core-anime-4k-manager"
import { vc_frameGenOption, frameGenOptions } from "@/app/(main)/_features/video-core/video-core-frame-gen"
import { FrameGenOption } from "@/app/(main)/_features/video-core/video-core-frame-gen-manager"
import { vc_menuOpen } from "@/app/(main)/_features/video-core/video-core-atoms"
import { vc_menuSectionOpen } from "@/app/(main)/_features/video-core/video-core-atoms"
import { vc_menuSubSectionOpen } from "@/app/(main)/_features/video-core/video-core-atoms"
import { vc_isMobile } from "@/app/(main)/_features/video-core/video-core-atoms"
import { vc_playbackRate } from "@/app/(main)/_features/video-core/video-core-atoms"
import { vc_isFullscreen } from "@/app/(main)/_features/video-core/video-core-atoms"
import { vc_miniPlayer } from "@/app/(main)/_features/video-core/video-core-atoms"
import { vc_containerElement } from "@/app/(main)/_features/video-core/video-core-atoms"
import { VideoCoreControlButtonIcon } from "@/app/(main)/_features/video-core/video-core-control-bar"
import {
    VideoCoreMenu,
    VideoCoreMenuOption,
    VideoCoreMenuSectionBody,
    VideoCoreMenuSubmenuBody,
    VideoCoreMenuSubOption,
    VideoCoreMenuSubSubmenuBody,
    VideoCoreMenuTitle,
    VideoCoreSettingSelect,
    VideoCoreSettingTextInput,
} from "@/app/(main)/_features/video-core/video-core-menu"
import { videoCorePreferencesModalAtom } from "@/app/(main)/_features/video-core/video-core-preferences"
import {
    vc_autoNextAtom,
    vc_autoPlayVideoAtom,
    vc_autoSkipOPEDAtom,
    vc_beautifyImageAtom,
    vc_highlightOPEDChaptersAtom,
    vc_initialSettings,
    vc_settings,
    vc_showChapterMarkersAtom,
    vc_storedPlaybackRateAtom,
    VideoCoreSettings,
} from "@/app/(main)/_features/video-core/video-core.atoms"
import { vc_dispatchAction } from "@/app/(main)/_features/video-core/video-core.utils"
import { useServerStatus } from "@/app/(main)/_hooks/use-server-status"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { upath } from "@/lib/helpers/upath"
import { useVideoPlayerTranslation } from "@/lib/i18n/use-video-player-translation"
import { useAtomValue } from "jotai"
import { useAtom, useSetAtom } from "jotai/react"
import React, { useState } from "react"
import { HiFastForward } from "react-icons/hi"
import { ImFileText } from "react-icons/im"
import { IoCaretForwardCircleOutline } from "react-icons/io5"
import { LuChevronUp, LuHeading, LuPaintbrush, LuPalette, LuSettings, LuSettings2, LuSparkles, LuTvMinimalPlay } from "react-icons/lu"
import { MdOutlineAccessTime, MdOutlineSubtitles, MdSpeed } from "react-icons/md"
import { RiShadowLine } from "react-icons/ri"
import { TbArrowForwardUp } from "react-icons/tb"
import { VscTextSize } from "react-icons/vsc"

const SUBTITLE_STYLES_FONT_SIZE_OPTIONS = [
    { label: "Küçük", value: 54 },
    { label: "Orta", value: 62 },
    { label: "Büyük", value: 72 },
    { label: "Çok Büyük", value: 82 },
]

const SUBTITLE_STYLES_COLOR_OPTIONS = [
    { label: "Beyaz", value: "#FFFFFF" },
    { label: "Siyah", value: "#000000" },
    { label: "Gri", value: "#808080" },
    { label: "Sarı", value: "#FFD700" },
    { label: "Camgöbeği", value: "#00FFFF" },
    { label: "Pembe", value: "#FF69B4" },
    { label: "Mor", value: "#9370DB" },
    { label: "Limon Yeşili", value: "#00FF00" },
]

const SUBTITLE_STYLES_OUTLINE_WIDTH_OPTIONS = [
    { label: "Yok", value: 0 },
    { label: "Küçük", value: 2 },
    { label: "Orta", value: 3 },
    { label: "Büyük", value: 4 },
]

const SUBTITLE_STYLES_SHADOW_DEPTH_OPTIONS = [
    { label: "Yok", value: 0 },
    { label: "Küçük", value: 1 },
    { label: "Orta", value: 2 },
    { label: "Büyük", value: 3 },
]

export const SUBTITLE_STYLES_BACK_COLOR_OPACITY_OPTIONS = [
    { label: "100%", value: 0 },
    { label: "80%", value: 64 },
    { label: "70%", value: 77 },
    { label: "50%", value: 150 },
    { label: "25%", value: 200 },
    { label: "0%", value: 255 },
]

export const vc_subtitleStylesDefaults: VideoCoreSettings["subtitleCustomization"] = {
    enabled: false,
    fontName: "",
    fontSize: SUBTITLE_STYLES_FONT_SIZE_OPTIONS[1].value,
    primaryColor: SUBTITLE_STYLES_COLOR_OPTIONS[0].value,
    outlineColor: SUBTITLE_STYLES_COLOR_OPTIONS[1].value,
    backColor: SUBTITLE_STYLES_COLOR_OPTIONS[1].value,
    backColorOpacity: SUBTITLE_STYLES_BACK_COLOR_OPACITY_OPTIONS[0].value,
    outline: SUBTITLE_STYLES_OUTLINE_WIDTH_OPTIONS[2].value,
    shadow: SUBTITLE_STYLES_SHADOW_DEPTH_OPTIONS[0].value,
}

export function vc_getSubtitleStyle<T extends keyof VideoCoreSettings["subtitleCustomization"]>(settings: VideoCoreSettings["subtitleCustomization"] | undefined,
    key: T,
): NonNullable<VideoCoreSettings["subtitleCustomization"][T]> {
    return settings?.[key] ?? vc_subtitleStylesDefaults[key] as any
}

export function vc_getSubtitleStyleLabel<T extends keyof VideoCoreSettings["subtitleCustomization"]>(settings: VideoCoreSettings["subtitleCustomization"] | undefined,
    key: T,
): string {
    switch (key) {
        case "fontSize":
            return SUBTITLE_STYLES_FONT_SIZE_OPTIONS.find(o => o.value === vc_getSubtitleStyle(settings, key))?.label ?? ""
        case "outline":
            return SUBTITLE_STYLES_OUTLINE_WIDTH_OPTIONS.find(o => o.value === vc_getSubtitleStyle(settings, key))?.label ?? ""
        case "shadow":
            return SUBTITLE_STYLES_SHADOW_DEPTH_OPTIONS.find(o => o.value === vc_getSubtitleStyle(settings, key))?.label ?? ""
        case "primaryColor":
        case "outlineColor":
        case "backColor":
            return SUBTITLE_STYLES_COLOR_OPTIONS.find(o => o.value === vc_getSubtitleStyle(settings, key))?.label ?? ""
        // case "backColorOpacity":
        //     return `${((vc_getSubtitleStyle(settings, "backColorOpacity")-255) / 255 * 100).toFixed(0)}%`
    }
    return ""
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const CAPTION_STYLES_FONT_SIZE_OPTIONS = [
    { label: "Small", value: 4 },
    { label: "Medium", value: 5 },
    { label: "Large", value: 5.7 },
    { label: "Extra Large", value: 6.1 },
]

export const CAPTION_STYLES_TEXT_SHADOW_OPTIONS = [
    { label: "None", value: 0 },
    { label: "Small", value: 2 },
    { label: "Medium", value: 4 },
    { label: "Large", value: 6 },
]

export const CAPTION_STYLES_BACKGROUND_OPACITY_OPTIONS = [
    { label: "0%", value: 0 },
    { label: "25%", value: 0.25 },
    { label: "50%", value: 0.5 },
    { label: "70%", value: 0.7 },
    { label: "80%", value: 0.8 },
    { label: "100%", value: 1 },
]

export const CAPTION_STYLES_COLOR_OPTIONS = SUBTITLE_STYLES_COLOR_OPTIONS

export const vc_captionsStylesDefaults: VideoCoreSettings["captionCustomization"] = {
    fontSize: CAPTION_STYLES_FONT_SIZE_OPTIONS[1].value,
    textColor: CAPTION_STYLES_COLOR_OPTIONS[0].value,
    backgroundColor: SUBTITLE_STYLES_COLOR_OPTIONS[1].value,
    textShadow: CAPTION_STYLES_TEXT_SHADOW_OPTIONS[2].value,
    textShadowColor: CAPTION_STYLES_COLOR_OPTIONS[1].value,
    backgroundOpacity: CAPTION_STYLES_BACKGROUND_OPACITY_OPTIONS[3].value,
}

export function vc_getCaptionStyle<T extends keyof VideoCoreSettings["captionCustomization"]>(settings: VideoCoreSettings["captionCustomization"] | undefined,
    key: T,
): NonNullable<VideoCoreSettings["captionCustomization"][T]> {
    return settings?.[key] ?? vc_captionsStylesDefaults[key] as any
}

export function vc_getCaptionStyleLabel<T extends keyof VideoCoreSettings["captionCustomization"]>(settings: VideoCoreSettings["captionCustomization"] | undefined,
    key: T,
): string {
    switch (key) {
        case "fontSize":
            return CAPTION_STYLES_FONT_SIZE_OPTIONS.find(o => o.value === vc_getCaptionStyle(settings, key))?.label ?? ""
        case "textShadow":
            return CAPTION_STYLES_TEXT_SHADOW_OPTIONS.find(o => o.value === vc_getCaptionStyle(settings, key))?.label ?? ""
        case "backgroundColor":
        case "textShadowColor":
        case "textColor":
            return CAPTION_STYLES_COLOR_OPTIONS.find(o => o.value === vc_getCaptionStyle(settings, key))?.label ?? ""
        case "backgroundOpacity":
            return `${(vc_getCaptionStyle(settings, "backgroundOpacity") * 100).toFixed(0)}%`
    }
    return ""
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function VideoCoreSettingsMenu() {
    const t = useVideoPlayerTranslation()
    const serverStatus = useServerStatus()
    const isMobile = useAtomValue(vc_isMobile)
    const action = useSetAtom(vc_dispatchAction)
    const isMiniPlayer = useAtomValue(vc_miniPlayer)
    const playbackRate = useAtomValue(vc_playbackRate)
    const setPlaybackRate = useSetAtom(vc_storedPlaybackRateAtom)
    const isFullscreen = useAtomValue(vc_isFullscreen)
    const containerElement = useAtomValue(vc_containerElement)
    const subtitleManager = useAtomValue(vc_subtitleManager)
    const mediaCaptionsManager = useAtomValue(vc_mediaCaptionsManager)

    const [anime4kOption, setAnime4kOption] = useAtom(vc_anime4kOption)
    const currentAnime4kOption = getAnime4KOptionByValue(anime4kOption)

    const [frameGenOption, setFrameGenOption] = useAtom(vc_frameGenOption)

    const [, setKeybindingsModelOpen] = useAtom(videoCorePreferencesModalAtom)

    const [showChapterMarkers, setShowChapterMarkers] = useAtom(vc_showChapterMarkersAtom)
    const [highlightOPEDChapters, setHighlightOPEDChapters] = useAtom(vc_highlightOPEDChaptersAtom)
    const [beautifyImage, setBeautifyImage] = useAtom(vc_beautifyImageAtom)
    const [autoNext, setAutoNext] = useAtom(vc_autoNextAtom)
    const [autoPlay, setAutoPlay] = useAtom(vc_autoPlayVideoAtom)
    const [autoSkipOPED, setAutoSkipOPED] = useAtom(vc_autoSkipOPEDAtom)

    const [menuOpen, setMenuOpen] = useAtom(vc_menuOpen)
    const [openMenuSection, setOpenMenuSection] = useAtom(vc_menuSectionOpen)
    const [openMenuSubSection, setOpenMenuSubSection] = useAtom(vc_menuSubSectionOpen)

    const { mutate: openInExplorer, isPending: isOpeningInExplorer } = useOpenInExplorer()

    const [settings, setSettings] = useAtom(vc_settings)

    const [editedSubCustomization, setEditedSubCustomization] = useState<VideoCoreSettings["subtitleCustomization"]>(
        settings.subtitleCustomization || vc_initialSettings.subtitleCustomization,
    )

    const [editedCaptionCustomization, setEditedCaptionCustomization] = useState<VideoCoreSettings["captionCustomization"]>(
        settings.captionCustomization || vc_initialSettings.captionCustomization,
    )

    const [editedSubtitleDelay, setEditedSubtitleDelay] = useState(settings.subtitleDelay ?? 0)

    const [subFontName, setSubFontName] = useState<string>(editedSubCustomization?.fontName || "")

    React.useEffect(() => {
        if (openMenuSection === "Subtitle Styles") {
            setEditedSubCustomization(settings.subtitleCustomization || vc_initialSettings.subtitleCustomization)
        }
        if (openMenuSection === "Caption Styles") {
            setEditedCaptionCustomization(settings.captionCustomization || vc_initialSettings.captionCustomization)
        }
        if (openMenuSection === "Subtitle Delay") {
            setEditedSubtitleDelay(settings.subtitleDelay)
        }
    }, [openMenuSection, settings])

    const handleSaveSettings = (customization?: VideoCoreSettings["subtitleCustomization"]) => {
        const newSettings = {
            ...settings,
            subtitleCustomization: customization || editedSubCustomization,
        }
        setSettings(newSettings)
        subtitleManager?.updateSettings(newSettings)

        // // Go back to submenu after saving from sub-submenu
        // setOpenMenuSubSection(null)
    }

    const handleSaveCaptionSettings = (customization?: VideoCoreSettings["captionCustomization"]) => {
        const newSettings = {
            ...settings,
            captionCustomization: customization || editedCaptionCustomization,
        }
        setSettings(newSettings)
        mediaCaptionsManager?.updateSettings(newSettings)
    }

    const handleSubtitleCustomizationChange = <K extends keyof VideoCoreSettings["subtitleCustomization"]>(
        key: K,
        value: VideoCoreSettings["subtitleCustomization"][K],
    ): void => {
        const newCustomization = {
            ...editedSubCustomization,
            [key]: value,
        }
        setEditedSubCustomization(newCustomization)
        React.startTransition(() => {
            handleSaveSettings(newCustomization)
        })
    }

    const handleCaptionCustomizationChange = <K extends keyof VideoCoreSettings["captionCustomization"]>(
        key: K,
        value: VideoCoreSettings["captionCustomization"][K],
    ): void => {
        const newCustomization = {
            ...editedCaptionCustomization,
            [key]: value,
        }
        setEditedCaptionCustomization(newCustomization)
        React.startTransition(() => {
            handleSaveCaptionSettings(newCustomization)
        })
    }

    const handleSubtitleDelayChange = (delay: number): void => {
        setEditedSubtitleDelay(delay)
        const newSettings = {
            ...settings,
            subtitleDelay: delay,
        }
        setSettings(newSettings)
        subtitleManager?.updateSettings(newSettings)
        mediaCaptionsManager?.updateSettings(newSettings)
    }

    if (isMiniPlayer) return null

    return (
        <>
            {playbackRate !== 1 && (
                <p
                    className="text-sm text-[--muted] cursor-pointer" onClick={() => {
                    setMenuOpen("settings")
                    React.startTransition(() => {
                        setOpenMenuSection("Playback Speed")
                    })
                }}
                >
                    {`${(playbackRate).toFixed(2)}x`}
                </p>
            )}
            <VideoCoreMenu
                name="settings"
                trigger={<VideoCoreControlButtonIcon
                    icons={[
                        ["default", isMobile ? LuSettings : LuChevronUp],
                    ]}
                    state="default"
                    className={isMobile ? "text-xl" : ""}
                    onClick={() => {
                    }}
                />}
            >
                <VideoCoreMenuSectionBody>
                    <VideoCoreMenuTitle>{t.settings}</VideoCoreMenuTitle>
                    <VideoCoreMenuOption title={t.playbackSpeed} icon={MdSpeed} value={`${(playbackRate).toFixed(2)}x`} />
                    <VideoCoreMenuOption title={t.autoPlay} icon={IoCaretForwardCircleOutline} value={autoPlay ? t.on : t.off} />
                    <VideoCoreMenuOption title={t.autoNext} icon={HiFastForward} value={autoNext ? t.on : t.off} />
                    <VideoCoreMenuOption title={t.skipOPED} icon={TbArrowForwardUp} value={autoSkipOPED ? t.on : t.off} />
                    <VideoCoreMenuOption title={t.anime4k} icon={LuSparkles} value={currentAnime4kOption?.label || t.off} />
                    <VideoCoreMenuOption title="Kare Oluşturma" icon={LuSparkles} value={frameGenOptions.find(o => o.value === frameGenOption)?.label || t.off} />
                    {(subtitleManager || mediaCaptionsManager) && <VideoCoreMenuOption
                        title={t.subtitleDelay}
                        icon={MdOutlineAccessTime}
                        value={`${settings.subtitleDelay.toFixed(1)}s`}
                    />}
                    {subtitleManager && <VideoCoreMenuOption
                        title={t.subtitleStyles}
                        icon={MdOutlineSubtitles}
                        value={editedSubCustomization?.enabled ? `${t.on}${!!editedSubCustomization?.fontName ? ", " + t.font : ""}` : t.off}
                    />}
                    {mediaCaptionsManager && <VideoCoreMenuOption
                        title={t.captionStyles}
                        icon={MdOutlineSubtitles}
                    />}
                    <VideoCoreMenuOption title={t.playerAppearance} icon={LuTvMinimalPlay} />
                    <VideoCoreMenuOption title={t.preferences} icon={LuSettings2} onClick={() => setKeybindingsModelOpen(true)} />
                </VideoCoreMenuSectionBody>
                <VideoCoreMenuSubmenuBody>
                    <VideoCoreMenuOption title={t.subtitleStyles} icon={MdOutlineSubtitles}>
                        <p className="text-sm text-[--muted] mb-2">{t.subtitleCustomizationNote}</p>
                        <VideoCoreSettingSelect
                            options={[
                                { label: t.on, value: 1 },
                                { label: t.off, value: 0 },
                            ]}
                            onValueChange={(v: number) => handleSubtitleCustomizationChange("enabled", v === 1)}
                            value={editedSubCustomization.enabled ? 1 : 0}
                        />
                        {editedSubCustomization.enabled && <>
                            <p className="text-[--muted] text-sm my-2">{t.options}</p>
                            <VideoCoreMenuSubOption
                                title={t.font}
                                icon={LuHeading}
                                parentId="Subtitle Styles"
                                value={!editedSubCustomization.fontName ? t.default : editedSubCustomization.fontName?.slice(0,
                                    11) + (!!editedSubCustomization.fontName?.length && editedSubCustomization.fontName?.length > 10
                                    ? "..."
                                    : "")}
                            />
                            <VideoCoreMenuSubOption
                                title={t.fontSize}
                                icon={VscTextSize}
                                parentId="Subtitle Styles"
                                value={vc_getSubtitleStyleLabel(settings.subtitleCustomization, "fontSize")}
                            />
                            <VideoCoreMenuSubOption
                                title={t.textColor}
                                icon={LuPalette}
                                parentId="Subtitle Styles"
                                value={vc_getSubtitleStyleLabel(settings.subtitleCustomization, "primaryColor")}
                            />
                            <VideoCoreMenuSubOption
                                title={t.outline}
                                icon={ImFileText}
                                parentId="Subtitle Styles"
                                value={`${vc_getSubtitleStyleLabel(settings.subtitleCustomization,
                                    "outline")}, ${vc_getSubtitleStyleLabel(settings.subtitleCustomization, "outlineColor")}`}
                            />
                            <VideoCoreMenuSubOption
                                title={t.shadow}
                                icon={RiShadowLine}
                                parentId="Subtitle Styles"
                                value={`${vc_getSubtitleStyleLabel(settings.subtitleCustomization,
                                    "shadow")}, ${vc_getSubtitleStyleLabel(settings.subtitleCustomization, "backColor")}`}
                            />
                        </>}
                    </VideoCoreMenuOption>
                    <VideoCoreMenuOption title={t.captionStyles} icon={MdOutlineSubtitles}>
                        <p className="text-sm text-[--muted] mb-2">{t.captionCustomizationNote}</p>
                        {/*<VideoCoreSettingSelect*/}
                        {/*    options={[*/}
                        {/*        { label: t.on, value: 1 },*/}
                        {/*        { label: t.off, value: 0 },*/}
                        {/*    ]}*/}
                        {/*    onValueChange={(v: number) => handleCaptionCustomizationChange("enabled", v === 1)}*/}
                        {/*    value={editedCaptionCustomization.enabled ? 1 : 0}*/}
                        {/*/>*/}
                        {/*{editedCaptionCustomization.enabled && <>*/}
                        <p className="text-[--muted] text-sm my-2">{t.options}</p>
                        <VideoCoreMenuSubOption
                            title={t.fontSize}
                            icon={VscTextSize}
                            parentId="Caption Styles"
                            value={vc_getCaptionStyleLabel(settings.captionCustomization, "fontSize")}
                        />
                        {/*<VideoCoreMenuSubOption title={t.font} icon={LuHeading} parentId="Caption Styles" />*/}
                        <VideoCoreMenuSubOption
                            title={t.textColor}
                            icon={LuPalette}
                            parentId="Caption Styles"
                            value={vc_getCaptionStyleLabel(settings.captionCustomization, "textColor")}
                        />
                        <VideoCoreMenuSubOption
                            title={t.background}
                            icon={LuPaintbrush}
                            parentId="Caption Styles"
                            value={`${vc_getCaptionStyleLabel(settings.captionCustomization,
                                "backgroundOpacity")}, ${vc_getCaptionStyleLabel(settings.captionCustomization, "backgroundColor")}`}
                        />
                        {/*<VideoCoreMenuSubOption title={t.outline} icon={ImFileText} parentId="Caption Styles" />*/}
                        <VideoCoreMenuSubOption
                            title={t.shadow}
                            icon={RiShadowLine}
                            parentId="Caption Styles"
                            value={`${vc_getCaptionStyleLabel(settings.captionCustomization,
                                "textShadow")}, ${vc_getCaptionStyleLabel(settings.captionCustomization, "textShadowColor")}`}
                        />
                        {/*</>}*/}
                    </VideoCoreMenuOption>
                    <VideoCoreMenuOption title={t.subtitleDelay} icon={MdOutlineAccessTime}>
                        <p className="text-sm text-[--muted] mb-2">{t.subtitleDelayNote}</p>
                        <div className="flex gap-1.5 items-center mt-3">
                            <Button
                                className="px-1 !text-xs flex-1"
                                intent="gray-subtle"
                                size="sm"
                                onClick={() => handleSubtitleDelayChange(parseFloat((editedSubtitleDelay - 0.5).toFixed(1)))}
                            >
                                −0.5
                            </Button>
                            <Button
                                className="px-1 !text-xs flex-1"
                                intent="gray-subtle"
                                size="sm"
                                onClick={() => handleSubtitleDelayChange(parseFloat((editedSubtitleDelay - 0.1).toFixed(1)))}
                            >
                                −0.1
                            </Button>
                            <span className="text-sm text-center text-[--muted] px-1 flex-1">
                                {editedSubtitleDelay.toFixed(1)}s
                            </span>
                            <Button
                                className="px-1 !text-xs flex-1"
                                intent="gray-subtle"
                                size="sm"
                                onClick={() => handleSubtitleDelayChange(parseFloat((editedSubtitleDelay + 0.1).toFixed(1)))}
                            >
                                +0.1
                            </Button>
                            <Button
                                className="px-1 !text-xs flex-1"
                                intent="gray-subtle"
                                size="sm"
                                onClick={() => handleSubtitleDelayChange(parseFloat((editedSubtitleDelay + 0.5).toFixed(1)))}
                            >
                                +0.5
                            </Button>
                        </div>
                        <VideoCoreSettingSelect
                            options={[
                                { label: "-2.0s", value: -2.0 },
                                { label: "-1.0s", value: -1.0 },
                                { label: "-0.5s", value: -0.5 },
                                { label: "0s", value: 0 },
                                { label: "0.5s", value: 0.5 },
                                { label: "1.0s", value: 1.0 },
                                { label: "2.0s", value: 2.0 },
                            ]}
                            onValueChange={(v: number) => {
                                handleSubtitleDelayChange(v)
                            }}
                            value={[-2.0, -1.0, -0.5, 0, 0.5, 0.1, 2.0].includes(editedSubtitleDelay) ? editedSubtitleDelay : null}
                        />
                    </VideoCoreMenuOption>
                    <VideoCoreMenuOption title={t.playbackSpeed} icon={MdSpeed}>
                        <VideoCoreSettingSelect
                            options={[
                                { label: "0.5x", value: 0.5 },
                                { label: "0.9x", value: 0.9 },
                                { label: "1x", value: 1 },
                                { label: "1.1x", value: 1.1 },
                                { label: "1.5x", value: 1.5 },
                                { label: "2x", value: 2 },
                            ]}
                            onValueChange={(v: number) => {
                                setPlaybackRate(v)
                            }}
                            value={playbackRate}
                        />
                    </VideoCoreMenuOption>
                    <VideoCoreMenuOption title={t.autoPlay} icon={IoCaretForwardCircleOutline}>
                        <VideoCoreSettingSelect
                            options={[
                                { label: t.on, value: 1 },
                                { label: t.off, value: 0 },
                            ]}
                            onValueChange={(v: number) => {
                                setAutoPlay(!!v)
                            }}
                            value={autoPlay ? 1 : 0}
                        />
                    </VideoCoreMenuOption>
                    <VideoCoreMenuOption title={t.autoNext} icon={HiFastForward}>
                        <VideoCoreSettingSelect
                            options={[
                                { label: t.on, value: 1 },
                                { label: t.off, value: 0 },
                            ]}
                            onValueChange={(v: number) => {
                                setAutoNext(!!v)
                            }}
                            value={autoNext ? 1 : 0}
                        />
                    </VideoCoreMenuOption>
                    <VideoCoreMenuOption title={t.skipOPED} icon={TbArrowForwardUp}>
                        <VideoCoreSettingSelect
                            options={[
                                { label: t.on, value: 1 },
                                { label: t.off, value: 0 },
                            ]}
                            onValueChange={(v: number) => {
                                setAutoSkipOPED(!!v)
                            }}
                            value={autoSkipOPED ? 1 : 0}
                        />
                    </VideoCoreMenuOption>
                    <VideoCoreMenuOption title={t.anime4k} icon={LuSparkles}>
                        <p className="text-[--muted] text-sm mb-2">
                            {t.anime4kNote}
                        </p>
                        <VideoCoreSettingSelect
                            isFullscreen={isFullscreen}
                            containerElement={containerElement}
                            options={anime4kOptions.map(option => ({
                                label: `${option.label}`,
                                value: option.value,
                                moreInfo: option.performance === "heavy" ? t.heavy : undefined,
                                description: option.description,
                            }))}
                            onValueChange={(value: Anime4KOption) => {
                                setAnime4kOption(value)
                            }}
                            value={anime4kOption}
                        />
                    </VideoCoreMenuOption>
                    <VideoCoreMenuOption title="Kare Oluşturma" icon={LuSparkles}>
                        <p className="text-[--muted] text-sm mb-2">
                            Performansı artırın ve akıcılığı deneyimleyin. Gerçek zamanlı kare enterpolasyonu ile daha pürüzsüz animasyonlar. (Deneysel)
                        </p>
                        <VideoCoreSettingSelect
                            isFullscreen={isFullscreen}
                            containerElement={containerElement}
                            options={frameGenOptions.map(option => ({
                                label: option.label,
                                value: option.value,
                                description: option.description,
                            }))}
                            onValueChange={(value: FrameGenOption) => {
                                setFrameGenOption(value)
                            }}
                            value={frameGenOption}
                        />
                    </VideoCoreMenuOption>
                    <VideoCoreMenuOption title={t.playerAppearance} icon={LuPaintbrush}>
                        <Switch
                            label={t.showChapterMarkers}
                            side="right"
                            fieldClass="hover:bg-transparent hover:border-transparent px-0 ml-0 w-full"
                            size="sm"
                            value={showChapterMarkers}
                            onValueChange={setShowChapterMarkers}
                        />
                        <Switch
                            label={t.highlightOPEDChapters}
                            side="right"
                            fieldClass="hover:bg-transparent hover:border-transparent px-0 ml-0 w-full"
                            size="sm"
                            value={highlightOPEDChapters}
                            onValueChange={setHighlightOPEDChapters}
                        />
                        <Switch
                            label={t.beautifyImage}
                            side="right"
                            fieldClass="hover:bg-transparent hover:border-transparent px-0 ml-0 w-full"
                            size="sm"
                            value={beautifyImage}
                            onValueChange={setBeautifyImage}
                        />
                    </VideoCoreMenuOption>
                </VideoCoreMenuSubmenuBody>
                <VideoCoreMenuSubSubmenuBody>
                    <VideoCoreMenuSubOption title={t.font} icon={VscTextSize} parentId="Subtitle Styles">
                        <div className="">
                            <p className="text-sm mb-2">Custom Font</p>
                            <p className="text-sm text-[--muted] mb-2">
                                Place the font file in the <span
                                className="text-indigo-300 cursor-pointer underline underline-offset-2"
                                onClick={() => {
                                    openInExplorer({ path: upath.normalize(`${serverStatus?.dataDir}/assets`) })
                                }}
                            >Seanime assets directory</span>. The file name must match
                                the font name exactly.
                            </p>
                            <div className="space-y-2">
                                <VideoCoreSettingTextInput
                                    label="File Name"
                                    value={subFontName ?? ""}
                                    onValueChange={(v: string) => setSubFontName(v)}
                                    help="Example: Noto Sans JP.woff2"
                                />
                                <div className="flex w-full">
                                    <Button
                                        size="sm" intent="gray-glass" onClick={() => {
                                        handleSubtitleCustomizationChange("fontName", subFontName)
                                    }}
                                    >
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </VideoCoreMenuSubOption>
                    <VideoCoreMenuSubOption title={t.fontSize} icon={LuHeading} parentId="Subtitle Styles">
                        <p className="text-[--muted] text-sm mb-2">{t.fontSize}</p>
                        <VideoCoreSettingSelect
                            options={SUBTITLE_STYLES_FONT_SIZE_OPTIONS}
                            onValueChange={(v: number) => handleSubtitleCustomizationChange("fontSize", v)}
                            value={vc_getSubtitleStyle(editedSubCustomization, "fontSize")}
                        />
                    </VideoCoreMenuSubOption>
                    <VideoCoreMenuSubOption title={t.textColor} icon={LuPalette} parentId="Subtitle Styles">
                        <VideoCoreSettingSelect
                            options={SUBTITLE_STYLES_COLOR_OPTIONS}
                            onValueChange={(v: string) => handleSubtitleCustomizationChange("primaryColor", v)}
                            value={vc_getSubtitleStyle(editedSubCustomization, "primaryColor")}
                        />
                    </VideoCoreMenuSubOption>
                    <VideoCoreMenuSubOption title={t.outline} icon={LuPalette} parentId="Subtitle Styles">
                        <p className="text-[--muted] text-sm mb-2">{t.outline}</p>
                        <VideoCoreSettingSelect
                            options={SUBTITLE_STYLES_OUTLINE_WIDTH_OPTIONS}
                            onValueChange={(v: number) => handleSubtitleCustomizationChange("outline", v)}
                            value={vc_getSubtitleStyle(editedSubCustomization, "outline")}
                        />
                        <p className="text-[--muted] text-sm my-2">{t.textColor}</p>
                        <VideoCoreSettingSelect
                            options={SUBTITLE_STYLES_COLOR_OPTIONS}
                            onValueChange={(v: string) => handleSubtitleCustomizationChange("outlineColor", v)}
                            value={vc_getSubtitleStyle(editedSubCustomization, "outlineColor")}
                        />
                    </VideoCoreMenuSubOption>
                    <VideoCoreMenuSubOption title={t.shadow} icon={LuPalette} parentId="Subtitle Styles">
                        <p className="text-[--muted] text-sm mb-2">{t.shadow}</p>
                        <VideoCoreSettingSelect
                            options={SUBTITLE_STYLES_SHADOW_DEPTH_OPTIONS}
                            onValueChange={(v: number) => handleSubtitleCustomizationChange("shadow", v)}
                            value={vc_getSubtitleStyle(editedSubCustomization, "shadow")}
                        />
                        <p className="text-[--muted] text-sm my-2">Opaklık</p>
                        <VideoCoreSettingSelect
                            options={SUBTITLE_STYLES_BACK_COLOR_OPACITY_OPTIONS}
                            onValueChange={(v: number) => handleSubtitleCustomizationChange("backColorOpacity", v)}
                            value={vc_getSubtitleStyle(editedSubCustomization, "backColorOpacity")}
                        />
                        <p className="text-[--muted] text-sm my-2">{t.textColor}</p>
                        <VideoCoreSettingSelect
                            options={SUBTITLE_STYLES_COLOR_OPTIONS}
                            onValueChange={(v: string) => handleSubtitleCustomizationChange("backColor", v)}
                            value={vc_getSubtitleStyle(editedSubCustomization, "backColor")}
                        />
                    </VideoCoreMenuSubOption>
                    <VideoCoreMenuSubOption title={t.fontSize} icon={VscTextSize} parentId="Caption Styles">
                        {/*<p className="text-[--muted] text-sm mb-2">Font size as percentage of video height</p>*/}
                        <VideoCoreSettingSelect
                            options={CAPTION_STYLES_FONT_SIZE_OPTIONS}
                            onValueChange={(v: number) => handleCaptionCustomizationChange("fontSize", v)}
                            value={vc_getCaptionStyle(editedCaptionCustomization, "fontSize")}
                        />
                    </VideoCoreMenuSubOption>
                    {/*<VideoCoreMenuSubOption title="Font Family" icon={LuHeading} parentId="Caption Styles">*/}
                    {/*    /!*<p className="text-[--muted] text-sm mb-2">Font family for captions</p>*!/*/}
                    {/*    <VideoCoreSettingSelect*/}
                    {/*        options={[*/}
                    {/*            { label: "Inter", value: "Inter, Arial, sans-serif" },*/}
                    {/*            { label: "Arial", value: "Arial, sans-serif" },*/}
                    {/*            { label: "Courier", value: "Courier New, monospace" },*/}
                    {/*            { label: "Georgia", value: "Georgia, serif" },*/}
                    {/*            { label: "Times", value: "Times New Roman, serif" },*/}
                    {/*        ]}*/}
                    {/*        onValueChange={(v: string) => handleCaptionCustomizationChange("fontFamily", v)}*/}
                    {/*        value={editedCaptionCustomization.fontFamily ?? "Inter, Arial, sans-serif"}*/}
                    {/*    />*/}
                    {/*</VideoCoreMenuSubOption>*/}
                    <VideoCoreMenuSubOption title={t.textColor} icon={LuPalette} parentId="Caption Styles">
                        <VideoCoreSettingSelect
                            options={CAPTION_STYLES_COLOR_OPTIONS}
                            onValueChange={(v: string) => handleCaptionCustomizationChange("textColor", v)}
                            value={vc_getCaptionStyle(editedCaptionCustomization, "textColor")}
                        />
                    </VideoCoreMenuSubOption>
                    <VideoCoreMenuSubOption title={t.background} icon={LuPaintbrush} parentId="Caption Styles">
                        <p className="text-[--muted] text-sm my-2">Opaklık</p>
                        <VideoCoreSettingSelect
                            options={CAPTION_STYLES_BACKGROUND_OPACITY_OPTIONS}
                            onValueChange={(v: number) => handleCaptionCustomizationChange("backgroundOpacity", v)}
                            value={vc_getCaptionStyle(editedCaptionCustomization, "backgroundOpacity")}
                        />
                        <p className="text-[--muted] text-sm mb-2">Renk</p>
                        <VideoCoreSettingSelect
                            options={CAPTION_STYLES_COLOR_OPTIONS}
                            onValueChange={(v: string) => handleCaptionCustomizationChange("backgroundColor", v)}
                            value={vc_getCaptionStyle(editedCaptionCustomization, "backgroundColor")}
                        />
                    </VideoCoreMenuSubOption>
                    <VideoCoreMenuSubOption title={t.shadow} icon={RiShadowLine} parentId="Caption Styles">
                        <p className="text-[--muted] text-sm mb-2">{t.shadow}</p>
                        <VideoCoreSettingSelect
                            options={CAPTION_STYLES_TEXT_SHADOW_OPTIONS}
                            onValueChange={(v: number) => handleCaptionCustomizationChange("textShadow", v)}
                            value={vc_getCaptionStyle(editedCaptionCustomization, "textShadow")}
                        />
                        <p className="text-[--muted] text-sm my-2">Renk</p>
                        <VideoCoreSettingSelect
                            options={CAPTION_STYLES_COLOR_OPTIONS}
                            onValueChange={(v: string) => handleCaptionCustomizationChange("textShadowColor", v)}
                            value={vc_getCaptionStyle(editedCaptionCustomization, "textShadowColor")}
                        />
                    </VideoCoreMenuSubOption>
                </VideoCoreMenuSubSubmenuBody>
            </VideoCoreMenu>
        </>
    )
}
