import { AL_AnimeDetailsById_Media, Anime_Entry, Anime_Episode } from "@/api/generated/types"
import { useGetAnimeEpisodeCollection } from "@/api/hooks/anime.hooks"
import { getEpisodeMinutesRemaining, getEpisodePercentageComplete, useGetContinuityWatchHistory } from "@/api/hooks/continuity.hooks"
import { SupabaseAnime } from "@/api/hooks/supabase-anime.hooks"
import { EpisodeCard } from "@/app/(main)/_features/anime/_components/episode-card"

import { useSeaCommandInject } from "@/app/(main)/_features/sea-command/use-inject"
import { useServerStatus } from "@/app/(main)/_hooks/use-server-status"
import { EpisodeListGrid, EpisodeListPaginatedGrid } from "@/app/(main)/entry/_components/episode-list-grid"
import { useAnimeEntryPageView } from "@/app/(main)/entry/_containers/anime-entry-page"
import { EpisodeItem } from "@/app/(main)/entry/_containers/episode-list/episode-item"
import { UndownloadedEpisodeList } from "@/app/(main)/entry/_containers/episode-list/undownloaded-episode-list"
import { useHandleEpisodeSection } from "@/app/(main)/entry/_lib/handle-episode-section"
import { useForcePlaybackMethod, useHandlePlayMedia } from "@/app/(main)/entry/_lib/handle-play-media"
import { episodeCardCarouselItemClass } from "@/components/shared/classnames"
import { Alert } from "@/components/ui/alert"
import { AppLayoutStack } from "@/components/ui/app-layout"
import { Carousel, CarouselContent, CarouselDotButtons, CarouselItem } from "@/components/ui/carousel"
import { ContextMenuItem } from "@/components/ui/context-menu"
import { useThemeSettings } from "@/lib/theme/theme-hooks"
import React from "react"
import { IoLibrarySharp } from "react-icons/io5"
import { LuTvMinimalPlay } from "react-icons/lu"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useSetAtom } from "jotai/react"
import { __onlinestream_selectedEpisodeNumberAtom } from "@/app/(main)/onlinestream/_lib/onlinestream.atoms"

type EpisodeSectionProps = {
    entry: Anime_Entry
    details: AL_AnimeDetailsById_Media | undefined
    supabaseAnime?: SupabaseAnime | null
    bottomSection: React.ReactNode
    hideCarousel?: boolean
    maxCol?: number
}

export function EpisodeSection({ entry, details, supabaseAnime: propSupabaseAnime, bottomSection, hideCarousel, maxCol = 4 }: EpisodeSectionProps) {
    const ts = useThemeSettings()
    const serverStatus = useServerStatus()
    const { currentView, setView } = useAnimeEntryPageView()
    const setOnlinestreamEpisodeNumber = useSetAtom(__onlinestream_selectedEpisodeNumberAtom)

    // Fix: Eğer array geliyorsa ilk elemanı al
    const supabaseAnime = React.useMemo(() => {
        return (Array.isArray(propSupabaseAnime) 
            ? propSupabaseAnime[0] 
            : propSupabaseAnime) as SupabaseAnime | null | undefined
    }, [propSupabaseAnime])

    const handleEpisodeClick = React.useCallback((episode: Anime_Episode) => {
        setOnlinestreamEpisodeNumber(episode.episodeNumber)
        setView("onlinestream")                                 
    }, [setView, setOnlinestreamEpisodeNumber])

    const { data: episodeCollection } = useGetAnimeEpisodeCollection(entry.mediaId)
    
    // Hibrit sistem: Supabase'den bölümleri kullan
    const supabaseEpisodes = React.useMemo(() => {
        if (!supabaseAnime?.episodes || !Array.isArray(supabaseAnime.episodes)) {
            console.log("❌ Supabase bölümleri yok, API kullanılıyor")
            return []
        }
        
        console.log("✅ Supabase bölümleri kullanılıyor:", supabaseAnime.episodes.length, "bölüm")
        
        // Supabase episode formatını Anime_Episode formatına dönüştür
        return supabaseAnime.episodes.map((ep: any) => ({
            type: "main" as const,
            displayTitle: `Bölüm ${ep.number}`,
            episodeTitle: ep.title || "",
            episodeNumber: ep.number,
            absoluteEpisodeNumber: ep.number,
            progressNumber: ep.number,
            isDownloaded: false,
            isInvalid: false,
            _isNakamaEpisode: false,
            episodeMetadata: {
                image: ep.thumbnail || undefined,
                summary: ep.summary || undefined,
                airDate: ep.airDate || undefined,
                hasImage: !!ep.thumbnail,
                title: ep.title || undefined,
            },
            baseAnime: entry.media,
        } as Anime_Episode))
    }, [supabaseAnime, entry.media])
    
    // Eğer Supabase'de bölümler varsa onları kullan, yoksa API'den gelen bölümleri kullan
    const allCollectionEpisodes = React.useMemo(() => {
        if (supabaseEpisodes.length > 0) {
            console.log("📺 Toplam", supabaseEpisodes.length, "bölüm Supabase'den yüklendi")
            return supabaseEpisodes.filter(ep => ep.type === "main")
        }
        console.log("📺 Bölümler API'den yükleniyor")
        return episodeCollection?.episodes?.filter(ep => ep.type === "main") || []
    }, [episodeCollection, supabaseEpisodes])
    
    const allSpecialEpisodes = React.useMemo(() => {
        if (supabaseEpisodes.length > 0) {
            return supabaseEpisodes.filter(ep => ep.type === "special")
        }
        return episodeCollection?.episodes?.filter(ep => ep.type === "special") || []
    }, [episodeCollection, supabaseEpisodes])

    const {
        media,
        hasInvalidEpisodes,
        mainEpisodes,
        specialEpisodes,
        ncEpisodes,
    } = useHandleEpisodeSection({ entry })

    const episodesToWatch = React.useMemo(() => {
        // Eğer Supabase bölümleri varsa onları kullan
        if (supabaseEpisodes.length > 0) {
            let ret = [...supabaseEpisodes]
            ret = ((!!entry.listData?.progress && !!entry.media?.episodes && entry.listData?.progress === entry.media?.episodes)
                    ? ret?.reverse()
                    : ret?.slice(entry.listData?.progress || 0)
            )?.slice(0, 30) || []
            return ret
        }
        
        // Yoksa normal API bölümlerini kullan
        if (!episodeCollection?.episodes) return []
        let ret = [...episodeCollection?.episodes]
        ret = ((!!entry.listData?.progress && !!entry.media?.episodes && entry.listData?.progress === entry.media?.episodes)
                ? ret?.reverse()
                : ret?.slice(entry.listData?.progress || 0)
        )?.slice(0, 30) || []
        return ret
    }, [episodeCollection?.episodes, supabaseEpisodes, entry.listData?.progress, entry.media?.episodes])

    const { playMediaFile, isUsingNativePlayer } = useHandlePlayMedia()

    const { forcePlaybackMethodFn } = useForcePlaybackMethod()

    const { data: watchHistory } = useGetContinuityWatchHistory()

    const { inject, remove } = useSeaCommandInject()

    React.useEffect(() => {
        if (!media) return

        // Combine all episode types
        const allEpisodes = [
            { ...episodesToWatch?.[0], type: "next" as const },
            ...mainEpisodes.map(ep => ({ ...ep, type: "main" as const })),
            ...specialEpisodes.map(ep => ({ ...ep, type: "special" as const })),
            ...ncEpisodes.map(ep => ({ ...ep, type: "other" as const })),
        ]

        inject("library-episodes", {
            items: allEpisodes.filter(n => !!n.episodeTitle).map(episode => ({
                data: episode,
                id: `${episode.type}-${episode.localFile?.path || ""}-${episode.episodeNumber}`,
                value: `${episode.episodeNumber}`,
                heading: episode.type === "next" ? "Sıradaki Bölüm" :
                    episode.type === "special" ? "Özeller" :
                        episode.type === "other" ? "Diğerleri" : "Bölümler",
                priority: episode.type === "next" ? 2 :
                    episode.type === "main" ? 1 : 0,
                render: () => (
                    <div className="flex gap-1 items-center w-full">
                        <p className="max-w-[70%] truncate">{episode.displayTitle}</p>
                        {!!episode.episodeTitle && (
                            <p className="text-[--muted] flex-1 truncate">- {episode.episodeTitle}</p>
                        )}
                    </div>
                ),
                onSelect: () => playMediaFile({
                    path: episode.localFile?.path ?? "",
                    mediaId: entry.mediaId,
                    episode: episode as Anime_Episode,
                }),
            })),
            filter: ({ item, input }) => {
                if (!input) return true
                return item.value.toLowerCase().includes(input.toLowerCase())
            },
            shouldShow: () => currentView === "library",
            priority: 1,
        })

        return () => remove("library-episodes")
    }, [media, episodesToWatch, mainEpisodes, specialEpisodes, ncEpisodes, currentView])

    if (!media || (!episodeCollection && supabaseEpisodes.length === 0)) return <LoadingSpinner />

    return (
        <>
            <AppLayoutStack spacing="lg" data-episode-section-stack>

                {hasInvalidEpisodes && <Alert
                    intent="alert"
                    description="Bazı bölümler geçersiz. Düzeltmek için meta verileri güncelleyin."
                />}


                {(episodesToWatch.length > 0 && !hideCarousel) && (
                    <>
                        <Carousel
                            className="w-full max-w-full"
                            gap="md"
                            opts={{
                                align: "start",
                            }}
                            data-episode-carousel
                        >
                            <CarouselDotButtons />
                            <CarouselContent>
                                {episodesToWatch.map((episode, idx) => (
                                    <CarouselItem
                                        key={episode?.localFile?.path || idx}
                                        className={episodeCardCarouselItemClass(ts.smallerEpisodeCarouselSize)}
                                    >
                                        <EpisodeCard
                                            key={episode.localFile?.path || ""}
                                            episode={episode}
                                            image={episode.episodeMetadata?.image || episode.baseAnime?.bannerImage || episode.baseAnime?.coverImage?.extraLarge}
                                            topTitle={episode.episodeTitle || episode?.baseAnime?.title?.userPreferred}
                                            title={episode.displayTitle}
                                            isInvalid={episode.isInvalid}
                                            progressTotal={episode.baseAnime?.episodes}
                                            progressNumber={episode.progressNumber}
                                            episodeNumber={episode.episodeNumber}
                                            length={episode.episodeMetadata?.length}
                                            percentageComplete={getEpisodePercentageComplete(watchHistory, entry.mediaId, episode.episodeNumber)}
                                            minutesRemaining={getEpisodeMinutesRemaining(watchHistory, entry.mediaId, episode.episodeNumber)}
                                            fallbackImage={[episode.baseAnime?.bannerImage, episode.baseAnime?.coverImage?.large,
                                                episode.baseAnime?.coverImage?.extraLarge]}
                                            onClick={() => handleEpisodeClick(episode)}
                                            anime={{
                                                id: entry.mediaId,
                                                image: episode.baseAnime?.coverImage?.medium,
                                                title: episode?.baseAnime?.title?.userPreferred,
                                            }}
                                            additionalContextMenuItems={<>
                                                {isUsingNativePlayer && <ContextMenuItem
                                                    onClick={() => {
                                                        forcePlaybackMethodFn("playbackmanager", () => {
                                                            playMediaFile({
                                                                path: episode.localFile?.path ?? "",
                                                                mediaId: entry.mediaId,
                                                                episode: episode,
                                                            })
                                                        })
                                                    }}
                                                >
                                                    <LuTvMinimalPlay /> Harici oynatıcıda aç
                                                </ContextMenuItem>}
                                            </>}
                                        />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>
                    </>
                )}


                <div className="space-y-10" data-episode-list-stack>
                    <EpisodeListPaginatedGrid
                        maxCol={maxCol}
                        length={allCollectionEpisodes.length}
                        renderItem={(index) => (
                            <EpisodeItem
                                key={allCollectionEpisodes[index].episodeNumber}
                                episode={allCollectionEpisodes[index]}
                                media={media}
                                isWatched={!!entry.listData?.progress && entry.listData.progress >= allCollectionEpisodes[index].progressNumber}
                                onPlay={() => handleEpisodeClick(allCollectionEpisodes[index])}
                                onPlayExternally={!isUsingNativePlayer ? undefined : ({ path, mediaId }) => forcePlaybackMethodFn("playbackmanager",
                                    () => playMediaFile({
                                        path,
                                        mediaId,
                                        episode: allCollectionEpisodes[index],
                                    }))}
                                percentageComplete={getEpisodePercentageComplete(watchHistory, entry.mediaId, allCollectionEpisodes[index].episodeNumber)}
                                minutesRemaining={getEpisodeMinutesRemaining(watchHistory, entry.mediaId, allCollectionEpisodes[index].episodeNumber)}
                            />
                        )}
                    />

                    {allSpecialEpisodes.length > 0 && <>
                        <h2>Özeller</h2>
                        <EpisodeListGrid data-episode-list-specials maxCol={maxCol}>
                            {allSpecialEpisodes.map(episode => (
                                <EpisodeItem
                                    key={episode.episodeNumber}
                                    episode={episode}
                                    media={media}
                                    onPlay={() => handleEpisodeClick(episode)}
                                    onPlayExternally={!isUsingNativePlayer ? undefined : ({ path, mediaId }) => forcePlaybackMethodFn(
                                        "playbackmanager",
                                        () => playMediaFile({
                                            path,
                                            mediaId,
                                            episode: episode,
                                        }))}
                                />
                            ))}
                        </EpisodeListGrid>
                    </>}

                    {ncEpisodes.length > 0 && <>
                        <h2>Diğerleri</h2>
                        <EpisodeListGrid data-episode-list-others maxCol={maxCol}>
                            {ncEpisodes.map(episode => (
                                <EpisodeItem
                                    key={episode.localFile?.path || ""}
                                    episode={episode}
                                    media={media}
                                    onPlay={() => handleEpisodeClick(episode)}
                                    onPlayExternally={!isUsingNativePlayer ? undefined : ({ path, mediaId }) => forcePlaybackMethodFn(
                                        "playbackmanager",
                                        () => playMediaFile({
                                            path,
                                            mediaId,
                                            episode: episode,
                                        }))}
                                />
                            ))}
                        </EpisodeListGrid>
                    </>}

                    {bottomSection}

                </div>
            </AppLayoutStack>
        </>
    )

}
