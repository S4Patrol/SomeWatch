import { Anime_Entry } from "@/api/generated/types"
import { useGetAnilistAnimeDetails } from "@/api/hooks/anilist.hooks"
import { useGetAnimeEntry } from "@/api/hooks/anime_entries.hooks"
import { useGetSupabaseAnimeByAnilistId } from "@/api/hooks/supabase-anime.hooks"
import { MediaEntryCharactersSection } from "@/app/(main)/_features/media/_components/media-entry-characters-section"
import { MediaEntryPageLoadingDisplay } from "@/app/(main)/_features/media/_components/media-entry-page-loading-display"
import { PluginWebviewSlot } from "@/app/(main)/_features/plugin/webview/plugin-webviews"
import { useSeaCommandInject } from "@/app/(main)/_features/sea-command/use-inject"

import { vc_isFullscreen } from "@/app/(main)/_features/video-core/video-core-atoms"
import { useServerStatus } from "@/app/(main)/_hooks/use-server-status"
import { MetaSection } from "@/app/(main)/entry/_components/meta-section"
import { RelationsRecommendationsSection } from "@/app/(main)/entry/_components/relations-recommendations-section"
import { DebridStreamPage } from "@/app/(main)/entry/_containers/debrid-stream/debrid-stream-page"
import { EpisodeSection } from "@/app/(main)/entry/_containers/episode-list/episode-section"
import { __torrentSearch_selectionAtom, TorrentSearchDrawer } from "@/app/(main)/entry/_containers/torrent-search/torrent-search-drawer"
import { TorrentStreamPage } from "@/app/(main)/entry/_containers/torrent-stream/torrent-stream-page"
import { OnlinestreamPage } from "@/app/(main)/onlinestream/_containers/onlinestream-page"
import { PageWrapper } from "@/components/shared/page-wrapper"
import { cn } from "@/components/ui/core/styling"
import { StaticTabs } from "@/components/ui/tabs"
import { usePathname, useRouter, useSearchParams } from "@/lib/navigation"
import { useThemeSettings } from "@/lib/theme/theme-hooks"
import { atom, useAtomValue } from "jotai"
import { useAtom, useSetAtom } from "jotai/react"
import { AnimatePresence } from "motion/react"
import React from "react"
import { FiGlobe } from "react-icons/fi"
import { HiOutlineServerStack } from "react-icons/hi2"
import { IoLibraryOutline } from "react-icons/io5"
import { PiMonitorPlayDuotone } from "react-icons/pi"
import { useUnmount } from "react-use"

export const __anime_entryPageViewAtom = atom<"library" | "torrentstream" | "debridstream" | "onlinestream">("library")

export function useAnimeEntryPageView() {
    const [currentView, setView] = useAtom(__anime_entryPageViewAtom)

    const isLibraryView = currentView === "library"
    const isTorrentStreamingView = currentView === "torrentstream"
    const isDebridStreamingView = currentView === "debridstream"
    const isOnlineStreamingView = currentView === "onlinestream"

    function toggleTorrentStreamingView() {
        setView(p => p === "torrentstream" ? "library" : "torrentstream")
    }

    function toggleDebridStreamingView() {
        setView(p => p === "debridstream" ? "library" : "debridstream")
    }

    function toggleOnlineStreamingView() {
        setView(p => p === "onlinestream" ? "library" : "onlinestream")
    }

    return {
        currentView,
        setView,
        isLibraryView,
        isTorrentStreamingView,
        isDebridStreamingView,
        isOnlineStreamingView,
        toggleTorrentStreamingView,
        toggleDebridStreamingView,
        toggleOnlineStreamingView,
    }
}

export function AnimeEntryPage() {

    const serverStatus = useServerStatus()
    const router = useRouter()
    const searchParams = useSearchParams()
    const mediaId = searchParams.get("id")
    const tab = searchParams.get("tab")
    const { data: animeEntry, isLoading: animeEntryLoading } = useGetAnimeEntry(mediaId)
    const { data: animeDetails, isLoading: animeDetailsLoading } = useGetAnilistAnimeDetails(mediaId)
    
    // Hibrit sistem: Supabase'den anime detayını çek
    const { data: supabaseAnime } = useGetSupabaseAnimeByAnilistId(
        mediaId ? parseInt(mediaId) : 0,
        !!mediaId
    )
    
    // Supabase'de varsa onu kullan, yoksa AniList'i kullan
    const isUsingSupabaseData = !!supabaseAnime
    
    const ts = useThemeSettings()

    const vc_fullscreen = useAtomValue(vc_isFullscreen)

    const { currentView, isLibraryView, setView } = useAnimeEntryPageView()
    const switchedView = React.useRef(false)

    React.useLayoutEffect(() => {
        if (!animeEntry) return
        try {
            if (animeEntry?.media?.title?.userPreferred) {
                document.title = `${animeEntry?.media?.title?.userPreferred} | Seanime`
            }
            // switchedView.current = false
        }
        catch {
        }
    }, [animeEntry])

    const mediaIdRef = React.useRef(mediaId)

    React.useEffect(() => {
        if (mediaIdRef.current !== mediaId) {
            switchedView.current = false
            mediaIdRef.current = mediaId
        }

        if (animeEntryLoading || !mediaId) {
            switchedView.current = false
            return
        }

        if (
            !animeEntryLoading &&
            animeEntry &&
            animeEntry?.media?.status === "NOT_YET_RELEASED"
        ) {
            switchedView.current = true
            setView("library")
            return
        }

        if (
            !animeEntryLoading &&
            !!tab &&
            tab !== "library" &&
            !switchedView.current
        ) {
            switchedView.current = true
            if (serverStatus?.settings?.library?.enableOnlinestream && tab === "onlinestream") {
                setView("onlinestream")
            }
        }


    }, [animeEntry, animeEntryLoading, mediaId, searchParams, serverStatus, currentView, tab])

    const pathname = usePathname()

    React.useEffect(() => {
        if (!pathname.startsWith("/entry")) return

        if (!mediaId || (!animeEntryLoading && !animeEntry)) {
            router.push("/")
        }
    }, [animeEntry, animeEntryLoading, pathname, mediaId])

    // Reset view when unmounting
    useUnmount(() => {
        setView("library")
    })

    const setTorrentSearchDrawer = useSetAtom(__torrentSearch_selectionAtom)

    const { inject, remove } = useSeaCommandInject()
    React.useEffect(() => {
        inject("anime-entry-navigation", {
            items: [
                {
                    id: "library",
                    description: "Bölüm listesi",
                    show: currentView !== "library",
                },
                {
                    id: "torrentstream",
                    description: "Torrent akışı",
                    show: serverStatus?.torrentstreamSettings?.enabled && currentView !== "torrentstream",
                },
                {
                    id: "debridstream",
                    description: "Debrid akışı",
                    show: serverStatus?.debridSettings?.enabled && serverStatus?.debridSettings?.provider && currentView !== "debridstream",
                },
                {
                    id: "onlinestream",
                    description: "Çevrimiçi yayın",
                    show: serverStatus?.settings?.library?.enableOnlinestream && currentView !== "onlinestream",
                },
            ].map(item => ({
                id: item.id,
                value: item.id,
                heading: "Views",
                data: item,
                render: () => <div>{item.description}</div>,
                onSelect: () => setView(item.id as any),
                shouldShow: () => !!item.show,
            })),
            filter: ({ item, input }) => {
                if (!input) return true
                return item.data?.description?.toLowerCase().startsWith(input.toLowerCase())
            },
            priority: -1,
        })

        return () => remove("anime-entry-navigation")
    }, [currentView, serverStatus])

    if (animeEntryLoading || animeDetailsLoading) return <MediaEntryPageLoadingDisplay />
    if (!animeEntry) return null

    return (
        <div data-anime-entry-page data-media={JSON.stringify(animeEntry.media)} data-anime-entry-list-data={JSON.stringify(animeEntry.listData)}>
            <MetaSection entry={animeEntry} details={animeDetails} supabaseAnime={supabaseAnime} />

            <div
                data-anime-entry-page-content-container
                className={cn(
                    "px-4 md:px-8 relative z-[8]",
                    (currentView === "onlinestream" && vc_fullscreen) && "z-[100]",
                )}
            >
                <PageWrapper
                    data-anime-entry-page-content
                    className={cn(
                        "relative 2xl:order-first pb-10 lg:min-h-[calc(100vh-10rem)]",
                        (currentView === "onlinestream" && vc_fullscreen) && "z-[100]",
                    )}
                    {...{
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0 },
                        exit: { opacity: 0, y: 20 },
                        transition: {
                            type: "spring",
                            damping: 12,
                            stiffness: 80,
                            delay: 0.5,
                        },
                    }}
                >
                    <PluginWebviewSlot slot="before-anime-entry-episode-list" />

                    <AnimatePresence mode="wait" initial={false}>

                        {(currentView === "library") && <PageWrapper
                            data-anime-entry-page-episode-list-view
                            key="episode-list"
                            className="relative 2xl:order-first pb-10"
                            {...{
                                initial: { opacity: 0, y: 60 },
                                animate: { opacity: 1, y: 0 },
                                exit: { opacity: 0, scale: 0.99 },
                                transition: {
                                    duration: 0.35,
                                },
                            }}
                        >
                            <div className="h-10" />
                            <EpisodeSection
                                entry={animeEntry}
                                details={animeDetails}
                                supabaseAnime={supabaseAnime}
                                bottomSection={<>
                                    <PluginWebviewSlot slot="after-anime-entry-episode-list" />
                                    <MediaEntryCharactersSection details={animeDetails} />
                                    <RelationsRecommendationsSection entry={animeEntry} details={animeDetails} />
                                </>}
                            />
                        </PageWrapper>}

                        {currentView === "torrentstream" &&
                            <TorrentStreamPage
                                entry={animeEntry}
                                bottomSection={<>
                                    <PluginWebviewSlot slot="after-anime-entry-episode-list" />
                                    <MediaEntryCharactersSection details={animeDetails} />
                                    <RelationsRecommendationsSection entry={animeEntry} details={animeDetails} />
                                </>}
                            />}

                        {currentView === "debridstream" &&
                            <DebridStreamPage
                                entry={animeEntry}
                                bottomSection={<>
                                    <PluginWebviewSlot slot="after-anime-entry-episode-list" />
                                    <MediaEntryCharactersSection details={animeDetails} />
                                    <RelationsRecommendationsSection entry={animeEntry} details={animeDetails} />
                                </>}
                            />}

                        {currentView === "onlinestream" && <PageWrapper
                            data-anime-entry-page-online-streaming-view
                            key="online-streaming-episodes"
                            className={cn(
                                "relative 2xl:order-first pb-10 lg:pt-0",
                                (currentView === "onlinestream" && vc_fullscreen) && "z-[100]",
                            )}
                            {...{
                                initial: { opacity: 0, y: 60 },
                                animate: { opacity: 1, y: 0 },
                                exit: { opacity: 0, scale: 0.99 },
                                transition: {
                                    duration: 0.35,
                                },
                            }}
                        >
                            <div className="h-10 lg:h-0" />
                            <div className="space-y-4" data-anime-entry-page-online-streaming-view-content>
                                {/*<div*/}
                                {/*    className="absolute right-0 top-[-0.5rem] lg:top-[-3rem]"*/}
                                {/*    data-anime-entry-page-online-streaming-view-content-title-container*/}
                                {/*>*/}
                                {/*    <h2 className="text-xl lg:text-3xl flex items-center gap-3">Online streaming</h2>*/}
                                {/*</div>*/}
                                <OnlinestreamPage
                                    animeEntry={animeEntry}
                                    animeEntryLoading={animeEntryLoading}
                                    hideBackButton
                                />
                                <PluginWebviewSlot slot="after-anime-entry-episode-list" />
                                <MediaEntryCharactersSection details={animeDetails} />
                                <RelationsRecommendationsSection entry={animeEntry} details={animeDetails} />
                            </div>
                        </PageWrapper>}

                    </AnimatePresence>

                    <PluginWebviewSlot slot="anime-screen-bottom" />
                </PageWrapper>
            </div>

            <TorrentSearchDrawer entry={animeEntry} />
        </div>
    )
}

type EntrySectionTabs = {
    children?: React.ReactNode
    entry: Anime_Entry
}

export function EntrySectionTabs(props: EntrySectionTabs) {

    const {
        children,
        entry,
        ...rest
    } = props

    const serverStatus = useServerStatus()

    const {
        isLibraryView,
        setView,
        isTorrentStreamingView,
        isDebridStreamingView,
        isOnlineStreamingView,
    } = useAnimeEntryPageView()

    if (
        !entry ||
        entry.media?.status === "NOT_YET_RELEASED") return null

    const hasTorrentStreaming = !!serverStatus?.torrentstreamSettings?.enabled
    const hasDebridStreaming = !!serverStatus?.debridSettings?.enabled && !!serverStatus?.debridSettings?.provider
    const hasOnlineStreaming = !!serverStatus?.settings?.library?.enableOnlinestream

    if (!hasTorrentStreaming && !hasDebridStreaming && !hasOnlineStreaming) return null

    return (
        <>
            <div
                className="w-full max-w-fit rounded-md lg:rounded-full border border-transparent mx-auto lg:mx-0 overflow-hidden"
                data-anime-entry-page-tabs-container
            >
                <StaticTabs
                    className="lg:h-10 flex-wrap lg:flex-nowrap overflow-hidden justify-center lg:justify-start"
                    triggerClass="px-4 py-1 text-[1.1rem] border border-transparent opacity-80 data-[current=true]:border-[--subtle] data-[current=true]:opacity-100 rounded-full data-[current=false]:scale-95 lg:scale-100 "
                    iconClass="size-5 hidden data-[current=true]:block"
                    items={[
                        {
                            name: "Bölüm listesi",
                            iconType: IoLibraryOutline,
                            isCurrent: isLibraryView,
                            onClick: () => setView("library"),
                        },
                        ...(hasTorrentStreaming ? [{
                            name: "Torrent Akışı",
                            iconType: PiMonitorPlayDuotone,
                            isCurrent: isTorrentStreamingView,
                            onClick: () => setView("torrentstream"),
                        }] : []),
                        ...(hasDebridStreaming ? [{
                            name: "Debrid Akışı",
                            iconType: HiOutlineServerStack,
                            isCurrent: isDebridStreamingView,
                            onClick: () => setView("debridstream"),
                        }] : []),
                        ...(hasOnlineStreaming ? [{
                            name: "Çevrimiçi Yayın",
                            iconType: FiGlobe,
                            isCurrent: isOnlineStreamingView,
                            onClick: () => setView("onlinestream"),
                        }] : []),
                    ]}
                />
            </div>
        </>
    )
}
