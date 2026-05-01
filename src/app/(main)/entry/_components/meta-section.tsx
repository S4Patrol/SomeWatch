import { AL_AnimeDetailsById_Media, Anime_Entry } from "@/api/generated/types"
import { SupabaseAnime } from "@/api/hooks/supabase-anime.hooks"
import { AnimeAutoDownloaderButton } from "@/app/(main)/_features/anime-library/_containers/anime-auto-downloader-button"
import { ToggleLockFilesButton } from "@/app/(main)/_features/anime-library/_containers/toggle-lock-files-button"
import { TrailerModal } from "@/app/(main)/_features/anime/_components/trailer-modal"
import { AnimeEntryStudio } from "@/app/(main)/_features/media/_components/anime-entry-studio"
import {
    AnimeEntryRankings,
    MediaEntryAudienceScore,
    MediaEntryGenresList,
} from "@/app/(main)/_features/media/_components/media-entry-metadata-components"
import {
    MediaPageHeader,
    MediaPageHeaderDetailsContainer,
    MediaPageHeaderEntryDetails,
} from "@/app/(main)/_features/media/_components/media-page-header-components"
import { MediaSyncTrackButton } from "@/app/(main)/_features/media/_containers/media-sync-track-button"
import { PluginWebviewSlot } from "@/app/(main)/_features/plugin/webview/plugin-webviews"
import { useHasDebridService, useHasTorrentProvider, useServerStatus } from "@/app/(main)/_hooks/use-server-status"
import { NextAiringEpisode } from "@/app/(main)/entry/_components/next-airing-episode"
import { EntrySectionTabs, useAnimeEntryPageView } from "@/app/(main)/entry/_containers/anime-entry-page"
import { AnimeEntryDropdownMenu } from "@/app/(main)/entry/_containers/entry-actions/anime-entry-dropdown-menu"
import { AnimeEntrySilenceToggle } from "@/app/(main)/entry/_containers/entry-actions/anime-entry-silence-toggle"
import { TorrentSearchButton } from "@/app/(main)/entry/_containers/torrent-search/torrent-search-button"
import { SeaLink } from "@/components/shared/sea-link"
import { Badge } from "@/components/ui/badge"
import { Button, ButtonProps, IconButton } from "@/components/ui/button"
import { cn } from "@/components/ui/core/styling"
import { Tooltip } from "@/components/ui/tooltip"
import { TORRENT_CLIENT } from "@/lib/server/settings"
import { getCustomSourceExtensionId, getCustomSourceMediaSiteUrl, isCustomSource } from "@/lib/server/utils"
import { useThemeSettings } from "@/lib/theme/theme-hooks"
import React from "react"
import { BiExtension } from "react-icons/bi"
import { IoInformationCircle } from "react-icons/io5"
import { LuExternalLink } from "react-icons/lu"
import { MdOutlineConnectWithoutContact } from "react-icons/md"
import { SiAnilist } from "react-icons/si"
import { useNakamaStatus } from "../../_features/nakama/nakama-manager"
import { PluginAnimePageButtons } from "../../_features/plugin/actions/plugin-actions"

export function AnimeMetaActionButton({ className, ...rest }: ButtonProps) {
    const ts = useThemeSettings()
    return <Button
        className={cn(
            "w-full",
            "lg:w-full lg:max-w-[280px]",
            className,
        )}
        {...rest}
    // intent="gray-outline"
    />
}

export function MetaSection(props: {
    entry: Anime_Entry,
    details: AL_AnimeDetailsById_Media | undefined,
    supabaseAnime?: SupabaseAnime | null
}) {
    const serverStatus = useServerStatus()
    const { entry, details } = props
    const ts = useThemeSettings()
    const nakamaStatus = useNakamaStatus()

    // Fix: Eğer array geliyorsa ilk elemanı al
    const supabaseAnime = (Array.isArray(props.supabaseAnime)
        ? props.supabaseAnime[0]
        : props.supabaseAnime) as SupabaseAnime | null | undefined

    if (!entry.media) return null

    const { hasTorrentProvider } = useHasTorrentProvider()
    const { hasDebridService } = useHasDebridService()
    const { currentView, setView, isLibraryView, isTorrentStreamingView, isDebridStreamingView, isOnlineStreamingView } = useAnimeEntryPageView()

    const listData = entry.listData
    const type = "anime"

    // Debug: Supabase verisini kontrol et
    React.useEffect(() => {
        if (supabaseAnime) {
            console.log('[MetaSection] ✅ Using Supabase data:', {
                title: supabaseAnime.english_name || supabaseAnime.romaji_name,
                description: supabaseAnime.description?.substring(0, 50) + '...',
                banner: supabaseAnime.banner_image,
                cover: supabaseAnime.cover_image,
                score: supabaseAnime.average_score,
                genres: supabaseAnime.genres
            })
        } else {
            console.log('[MetaSection] ❌ No Supabase data, using AniList')
        }
    }, [supabaseAnime])

    // Hibrit veri: Supabase'de varsa SADECE onun verilerini kullan
    const displayTitle = supabaseAnime
        ? (supabaseAnime.english_name || supabaseAnime.romaji_name || supabaseAnime.japanese_name || undefined)
        : entry.media?.title?.userPreferred

    const displayEnglishTitle = supabaseAnime
        ? (supabaseAnime.english_name || undefined)
        : entry.media?.title?.english

    const displayRomajiTitle = supabaseAnime
        ? (supabaseAnime.romaji_name || undefined)
        : entry.media?.title?.romaji

    const displayDescription = supabaseAnime
        ? (supabaseAnime.description || undefined)
        : entry.media?.description

    const displayBannerImage = supabaseAnime
        ? (supabaseAnime.banner_image || undefined)
        : entry.media?.bannerImage

    const displayCoverImage = supabaseAnime
        ? (supabaseAnime.cover_image || undefined)
        : (entry.media?.coverImage?.extraLarge || entry.media?.coverImage?.large)

    const displayMeanScore = supabaseAnime
        ? (supabaseAnime.average_score || undefined)
        : entry.media?.meanScore

    const displayGenres = supabaseAnime
        ? (supabaseAnime.genres || undefined)
        : details?.genres

    return (
        <MediaPageHeader
            backgroundImage={displayBannerImage}
            coverImage={displayCoverImage}
        >

            <MediaPageHeaderDetailsContainer>

                <MediaPageHeaderEntryDetails
                    coverImage={displayCoverImage}
                    title={displayTitle}
                    color={entry.media?.coverImage?.color}
                    englishTitle={displayEnglishTitle}
                    romajiTitle={displayRomajiTitle}
                    startDate={entry.media?.startDate}
                    season={entry.media?.season}
                    progressTotal={entry.media?.episodes}
                    status={entry.media?.status}
                    description={displayDescription}
                    listData={entry.listData}
                    media={entry.media}
                    type="anime"
                >
                    <div
                        data-anime-meta-section-details
                        className={cn(
                            "flex gap-3 flex-wrap items-center",
                            "justify-center lg:justify-start lg:max-w-[65vw]",
                        )}
                    >

                        <MediaEntryAudienceScore meanScore={displayMeanScore} badgeClass="bg-transparent" />

                        {supabaseAnime?.is_4k && (
                            <div className="flex items-center">
                                <div className="bg-gradient-to-br from-cyan-400 via-teal-500 to-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-[0_0_15px_rgba(20,184,166,0.5)] border border-white/20 tracking-tighter">
                                    4K
                                </div>
                            </div>
                        )}

                        {/* Supabase Badge - Subtle UI */}
                        {supabaseAnime && (
                            <Tooltip trigger={
                                <Badge
                                    size="lg"
                                    intent="gray"
                                    className="rounded-full px-3 border-transparent bg-transparent text-gray-300 hover:text-white transition-all hover:-translate-y-0.5"
                                >
                                    <span className="flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
                                        </svg>
                                        Veritabanımızda
                                    </span>
                                </Badge>
                            }>
                                Bu anime veritabanımızda mevcut
                            </Tooltip>
                        )}

                        {!isCustomSource(entry.mediaId) ? <AnimeEntryStudio studios={details?.studios} /> : (
                            <Badge
                                size="lg"
                                intent="gray"
                                className="rounded-full px-0 border-transparent bg-transparent transition-all hover:bg-transparent hover:text-white hover:-translate-y-0.5"
                                data-anime-entry-studio-badge
                            >
                                {details?.studios?.nodes?.[0]?.name}
                            </Badge>
                        )}

                        <MediaEntryGenresList genres={displayGenres} />

                        <div
                            data-anime-meta-section-rankings-container
                            className={cn(
                                "w-full",
                            )}
                        >
                            <AnimeEntryRankings rankings={details?.rankings} />
                        </div>

                    </div>
                </MediaPageHeaderEntryDetails>

                <PluginWebviewSlot slot="after-media-entry-details" />

                <div
                    data-anime-meta-section-buttons-container
                    className={cn(
                        "flex flex-row w-full gap-3 items-center justify-center lg:justify-start lg:max-w-[65vw]",
                        "flex-wrap",
                    )}
                >

                    {isCustomSource(entry.mediaId) && (
                        <Tooltip
                            trigger={<div>
                                <SeaLink href={`/custom-sources?provider=${getCustomSourceExtensionId(entry.media)}`}>
                                    <IconButton size="sm" intent="gray-link" className="px-0" icon={<BiExtension className="text-lg" />} />
                                </SeaLink>
                            </div>}
                        >
                            Özel kaynak
                        </Tooltip>
                    )}

                    {!isCustomSource(entry.mediaId) && <SeaLink href={`https://anilist.co/anime/${entry.mediaId}`} target="_blank">
                        <IconButton size="sm" intent="gray-link" className="px-0" icon={<SiAnilist className="text-lg" />} />
                    </SeaLink>}

                    {isCustomSource(entry.mediaId) && !!getCustomSourceMediaSiteUrl(entry.media) && <Tooltip
                        trigger={<div>
                            <SeaLink href={getCustomSourceMediaSiteUrl(entry.media)!} target="_blank">
                                <IconButton size="sm" intent="gray-link" className="px-0" icon={<LuExternalLink className="text-lg" />} />
                            </SeaLink>
                        </div>}
                    >
                        Tarayıcıda aç
                    </Tooltip>}

                    {!!entry?.media?.trailer?.id && <TrailerModal
                        trailerId={entry?.media?.trailer?.id} trigger={
                            <Button size="sm" intent="gray-link" className="px-0">
                                Fragman
                            </Button>}
                    />}

                    <AnimeAutoDownloaderButton entry={entry} size="md" />

                    {isLibraryView && !entry._isNakamaEntry && !!entry.libraryData && <>
                        <MediaSyncTrackButton mediaId={entry.mediaId} type="anime" size="md" />
                        <AnimeEntrySilenceToggle mediaId={entry.mediaId} size="md" />
                        <ToggleLockFilesButton
                            allFilesLocked={entry.libraryData.allFilesLocked}
                            mediaId={entry.mediaId}
                            size="md"
                        />
                    </>}
                    <AnimeEntryDropdownMenu entry={entry} details={details} />


                    {(
                        entry.media.status !== "NOT_YET_RELEASED"
                        && (
                            serverStatus?.settings?.torrent?.defaultTorrentClient !== TORRENT_CLIENT.NONE
                            || hasDebridService
                        )
                        && !entry._isNakamaEntry
                    ) && (
                            <TorrentSearchButton
                                entry={entry}
                                onClick={() => {
                                    if (currentView !== "library") setView("library")
                                }}
                            />
                        )}

                    {entry._isNakamaEntry && currentView === "library" &&
                        <div className="flex items-center gap-2 h-10 px-4 border rounded-md flex-none">
                            <MdOutlineConnectWithoutContact className="size-6 animate-pulse text-[--blue]" />
                            <span className="text-sm tracking-wide">Paylaşan {nakamaStatus?.hostConnectionStatus?.username}</span>
                        </div>}

                    <PluginAnimePageButtons media={entry.media!} />

                </div>

                <EntrySectionTabs entry={entry} />

                <NextAiringEpisode media={entry.media} />

                {entry.downloadInfo?.hasInaccurateSchedule && <p
                    className={cn(
                        "text-[--muted] text-sm text-center mb-3",
                        "text-left",
                    )}
                    data-anime-meta-section-inaccurate-schedule-message
                >
                    <span className="block">Bu gösteri için doğru yayın takvimi bilgileri alınamadı.</span>
                    <span className="block text-[--muted]">Daha fazla bilgi için lütfen çevrimiçi takvimi kontrol edin.</span>
                </p>}


                {(!entry.anidbId || entry.anidbId === 0) && !isCustomSource(entry.mediaId) && entry.media?.status !== "NOT_YET_RELEASED" && (
                    <p
                        className={cn(
                            "text-center text-gray-200 opacity-50 text-sm flex gap-1 items-center",
                            "text-left",
                        )}
                        data-anime-meta-section-no-metadata-message
                    >
                        <IoInformationCircle />
                        Bu kayıt için bölüm meta verileri alınamıyor.
                    </p>
                )}


            </MediaPageHeaderDetailsContainer>

        </MediaPageHeader>

    )

}
