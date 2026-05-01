"use client"

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react"
import { useRouter } from "@/lib/navigation"
import { supabase } from "@/lib/supabase/client"
import { User as SupabaseUser } from "@supabase/supabase-js"
import { PageWrapper } from "@/components/shared/page-wrapper"
import { CustomLibraryBanner } from "@/app/(main)/_features/anime-library/_containers/custom-library-banner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { TextInput } from "@/components/ui/text-input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Modal } from "@/components/ui/modal"
import { Select } from "@/components/ui/select"
import { useAnilistListAnime, useGetAnilistAnimeDetails } from "@/api/hooks/anilist.hooks"
import { useGetAnimeEpisodeCollection } from "@/api/hooks/anime.hooks"
import { useDebounce } from "@/hooks/use-debounce"
import { LuLayoutDashboard, LuVideo, LuListVideo, LuShieldCheck, LuUsers, LuArrowLeft, LuPencil, LuTrash2, LuPlus, LuSave, LuSearch } from "react-icons/lu"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { BiSearch } from "react-icons/bi"
import { cn } from "@/components/ui/core/styling"
import { toast } from "sonner"
import {
    MediaPageHeader,
    MediaPageHeaderDetailsContainer,
    MediaPageHeaderEntryDetails,
} from "@/app/(main)/_features/media/_components/media-page-header-components"
import {
    AnimeEntryRankings,
    MediaEntryAudienceScore,
    MediaEntryGenresList,
} from "@/app/(main)/_features/media/_components/media-entry-metadata-components"
import { AnimeEntryStudio } from "@/app/(main)/_features/media/_components/anime-entry-studio"
import { TrailerModal } from "@/app/(main)/_features/anime/_components/trailer-modal"
import { MediaEntryCharactersSection } from "@/app/(main)/_features/media/_components/media-entry-characters-section"
import { RelationsRecommendationsSection } from "@/app/(main)/entry/_components/relations-recommendations-section"
import { Anime_Entry } from "@/api/generated/types"
import { SeaImage } from "@/components/shared/sea-image"
import { imageShimmer } from "@/components/shared/image-helpers"
import { getImageUrl } from "@/lib/server/assets"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { SubtitleUpload } from "@/app/(main)/fansub-paneli/_components/subtitle-upload"

const tabContentClass = cn(
    "space-y-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-500",
)

const ITEMS_PER_PAGE = 20

export default function FansubPaneliPage() {
    const router = useRouter()
    const [user, setUser] = useState<SupabaseUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState("dashboard")

    // Anime Management State
    const [animeSearch, setAnimeSearch] = useState("")         // "anime" tab search
    const [editAnimeSearch, setEditAnimeSearch] = useState("") // "edit" tab search
    const [episodesAnimeSearch, setEpisodesAnimeSearch] = useState("") // "episodes" tab anime search
    const debouncedAnimeSearch = useDebounce(animeSearch, 500)
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [stats, setStats] = useState({ animes: 0, episodes: 0 })

    // Anime Edit State
    const [supabaseAnimes, setSupabaseAnimes] = useState<any[]>([])
    const [isLoadingAnimes, setIsLoadingAnimes] = useState(false)
    const [editingAnime, setEditingAnime] = useState<any | null>(null)
    const [editForm, setEditForm] = useState<any>({})
    const [isDeleting, setIsDeleting] = useState(false)

    // Episode Management State
    const [selectedAnimeForEpisodes, setSelectedAnimeForEpisodes] = useState<any | null>(null)
    const [episodeSearch, setEpisodeSearch] = useState("")
    const [editingEpisode, setEditingEpisode] = useState<any | null>(null)
    const [episodeEditForm, setEpisodeEditForm] = useState<any>({})
    const [isUpdatingEpisode, setIsUpdatingEpisode] = useState(false)

    // Infinite scroll state — separate refs per tab to avoid conflict
    const [editPage, setEditPage] = useState(1)
    const [editHasMore, setEditHasMore] = useState(true)
    const [editIsLoadingMore, setEditIsLoadingMore] = useState(false)

    const editObserverTarget = useRef<HTMLDivElement>(null)
    const episodesObserverTarget = useRef<HTMLDivElement>(null)

    // Only fetch Anilist search when on anime tab AND search is non-empty
    const { data: searchResults, isFetching: isSearching } = useAnilistListAnime({
        search: debouncedAnimeSearch,
        page: 1,
        perPage: 10,
    }, !!debouncedAnimeSearch && tab === "anime")

    // Only fetch details when selectedId is non-null
    const { data: animeDetails, isFetching: isLoadingDetails } = useGetAnilistAnimeDetails(
        selectedId ?? undefined
    )
    const { data: episodeCollection, isFetching: isLoadingEpisodes } = useGetAnimeEpisodeCollection(
        selectedId ?? undefined
    )

    const selectedAnime = useMemo(
        () => searchResults?.Page?.media?.find(m => m?.id === selectedId) ?? null,
        [searchResults, selectedId]
    )

    // ─── Auth ────────────────────────────────────────────────────────────────
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) {
                    toast.error("Yetkisiz erişim", { description: "Lütfen önce giriş yapın." })
                    router.push("/")
                    return
                }

                const role = session.user?.user_metadata?.role?.toLowerCase()
                if (role !== "admin" && role !== "fansub") {
                    toast.error("Yetkisiz erişim", { description: "Bu sayfayı görüntüleme yetkiniz yok." })
                    router.push("/")
                    return
                }

                setUser(session.user)
                setLoading(false)

                const { count: animeCount } = await supabase
                    .from('animes')
                    .select('*', { count: 'exact', head: true })
                setStats(prev => ({ ...prev, animes: animeCount || 0 }))
            } catch (err) {
                console.error("[AUTH ERROR]", err)
                router.push("/")
            }
        }

        checkAuth()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ─── Load Supabase animes ────────────────────────────────────────────────
    const loadSupabaseAnimes = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
        if (reset) {
            setIsLoadingAnimes(true)
        } else {
            setEditIsLoadingMore(true)
            isLoadingRef.current = true
        }

        try {
            const from = (pageNum - 1) * ITEMS_PER_PAGE
            const to = from + ITEMS_PER_PAGE - 1

            const { data, error, count } = await supabase
                .from('animes')
                .select('*', { count: 'exact' })
                .order('updated_at', { ascending: false })
                .range(from, to)

            if (error) throw error

            const fetched = data || []

            if (reset) {
                setSupabaseAnimes(fetched)
                setEditHasMore(fetched.length < (count || 0))
            } else {
                setSupabaseAnimes(prev => {
                    const next = [...prev, ...fetched]
                    setEditHasMore(next.length < (count || 0))
                    return next
                })
            }
        } catch (e: any) {
            console.error(e)
            toast.error(`Animeler yüklenemedi: ${e.message}`)
        } finally {
            setIsLoadingAnimes(false)
            setEditIsLoadingMore(false)
            isLoadingRef.current = false
        }
    }, [])

    useEffect(() => {
        if (tab === "edit" || tab === "episodes") {
            setSupabaseAnimes([])
            setEditPage(1)
            setEditHasMore(true)
            loadSupabaseAnimes(1, true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab])

    // ─── Infinite scroll — edit tab ──────────────────────────────────────────
    const isLoadingRef = useRef(false)
    useEffect(() => {
        isLoadingRef.current = editIsLoadingMore
    }, [editIsLoadingMore])

    useEffect(() => {
        if (tab !== "edit" || !editObserverTarget.current) return

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && editHasMore && !isLoadingRef.current) {
                    setEditPage(prev => {
                        const next = prev + 1
                        loadSupabaseAnimes(next, false)
                        return next
                    })
                }
            },
            { threshold: 0.1 }
        )

        observer.observe(editObserverTarget.current)
        return () => observer.disconnect()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, editHasMore])

    // ─── Handlers: Anime Edit ────────────────────────────────────────────────
    const handleEditAnime = (anime: any) => {
        setEditingAnime(anime)
        setEditForm({
            english_name: anime.english_name || '',
            japanese_name: anime.japanese_name || '',
            romaji_name: anime.romaji_name || '',
            description: anime.description || '',
            banner_image: anime.banner_image || '',
            cover_image: anime.cover_image || '',
            genres: anime.genres || [],
            average_score: anime.average_score || 0,
            episodes: anime.episodes || [],
            is_4k: anime.is_4k || false,
        })
    }

    const handleUpdateAnime = async () => {
        if (!editingAnime) return
        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('animes')
                .update({
                    english_name: editForm.english_name,
                    japanese_name: editForm.japanese_name,
                    romaji_name: editForm.romaji_name,
                    description: editForm.description,
                    banner_image: editForm.banner_image,
                    cover_image: editForm.cover_image,
                    genres: editForm.genres,
                    average_score: editForm.average_score,
                    episodes: editForm.episodes,
                    is_4k: editForm.is_4k,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', editingAnime.id)

            if (error) throw error

            toast.success('Anime başarıyla güncellendi!')
            setEditingAnime(null)
            setSupabaseAnimes([])
            setEditPage(1)
            setEditHasMore(true)
            loadSupabaseAnimes(1, true)
        } catch (e: any) {
            console.error(e)
            toast.error(`Güncelleme hatası: ${e.message}`)
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteAnime = async (animeId: number) => {
        if (!confirm('Bu animeyi silmek istediğinizden emin misiniz?')) return
        setIsDeleting(true)
        try {
            const { error } = await supabase.from('animes').delete().eq('id', animeId)
            if (error) throw error

            toast.success('Anime başarıyla silindi!')
            setSupabaseAnimes([])
            setEditPage(1)
            setEditHasMore(true)
            loadSupabaseAnimes(1, true)

            const { count: animeCount } = await supabase.from('animes').select('*', { count: 'exact', head: true })
            setStats(prev => ({ ...prev, animes: animeCount || 0 }))
        } catch (e: any) {
            console.error(e)
            toast.error(`Silme hatası: ${e.message}`)
        } finally {
            setIsDeleting(false)
        }
    }

    const handleAddEpisode = () => {
        setEditForm((prev: any) => ({
            ...prev,
            episodes: [
                ...(prev.episodes || []),
                {
                    number: (prev.episodes?.length || 0) + 1,
                    title: '',
                    thumbnail: '',
                    summary: '',
                    airDate: new Date().toISOString().split('T')[0],
                },
            ],
        }))
    }

    const handleUpdateEpisode = (index: number, field: string, value: any) => {
        setEditForm((prev: any) => {
            const updatedEpisodes = [...(prev.episodes || [])]
            updatedEpisodes[index] = { ...updatedEpisodes[index], [field]: value }
            return { ...prev, episodes: updatedEpisodes }
        })
    }

    const handleDeleteEpisode = (index: number) => {
        setEditForm((prev: any) => ({
            ...prev,
            episodes: prev.episodes.filter((_: any, i: number) => i !== index),
        }))
    }

    // ─── Handlers: Episode Management ────────────────────────────────────────
    const handleEditEpisode = (episode: any, episodeIndex: number) => {
        setEditingEpisode({ ...episode, originalIndex: episodeIndex })
        setEpisodeEditForm({
            number: episode.number || episodeIndex + 1,
            title: episode.title || '',
            thumbnail: episode.thumbnail || '',
            summary: episode.summary || '',
            airDate: episode.airDate || new Date().toISOString().split('T')[0],
            duration: episode.duration || '',
            videoUrl: episode.videoUrl || '',
            video_sources: episode.video_sources || [],
            subtitleUrl: episode.subtitleUrl || '',
            quality: episode.quality || '1080p',
            fileSize: episode.fileSize || '',
            status: episode.status || 'available',
            subtitles: episode.subtitles || [],
            subtitleDelay: episode.subtitleDelay || 0,
        })
    }

    const handleUpdateEpisodeInAnime = async () => {
        if (!selectedAnimeForEpisodes || !editingEpisode) return
        setIsUpdatingEpisode(true)
        try {
            let updatedEpisodes = [...(selectedAnimeForEpisodes.episodes || [])]
            const episodeExists = editingEpisode.originalIndex < updatedEpisodes.length

            const episodeData = {
                number: episodeEditForm.number,
                title: episodeEditForm.title,
                thumbnail: episodeEditForm.thumbnail,
                summary: episodeEditForm.summary,
                airDate: episodeEditForm.airDate,
                duration: episodeEditForm.duration,
                videoUrl: episodeEditForm.videoUrl,
                video_sources: episodeEditForm.video_sources || [],
                subtitleUrl: episodeEditForm.subtitleUrl,
                quality: episodeEditForm.quality,
                fileSize: episodeEditForm.fileSize,
                status: episodeEditForm.status,
                subtitles: episodeEditForm.subtitles || [],
                subtitleDelay: episodeEditForm.subtitleDelay || 0,
            }

            if (episodeExists) {
                updatedEpisodes[editingEpisode.originalIndex] = episodeData
            } else {
                const targetNum = episodeEditForm.number
                for (let i = updatedEpisodes.length; i < targetNum - 1; i++) {
                    updatedEpisodes.push({
                        number: i + 1,
                        title: `Episode ${i + 1}`,
                        thumbnail: '',
                        summary: '',
                        airDate: new Date().toISOString().split('T')[0],
                        duration: '',
                        videoUrl: '',
                        subtitleUrl: '',
                        quality: '1080p',
                        fileSize: '',
                        status: 'available',
                        subtitles: [],
                    })
                }
                updatedEpisodes[targetNum - 1] = episodeData
            }

            const { error } = await supabase
                .from('animes')
                .update({ episodes: updatedEpisodes, updated_at: new Date().toISOString() })
                .eq('id', selectedAnimeForEpisodes.id)

            if (error) throw error

            setSelectedAnimeForEpisodes((prev: any) => ({ ...prev, episodes: updatedEpisodes }))
            setSupabaseAnimes(prev =>
                prev.map(anime =>
                    anime.id === selectedAnimeForEpisodes.id ? { ...anime, episodes: updatedEpisodes } : anime
                )
            )
            toast.success('Bölüm başarıyla güncellendi!')
            setEditingEpisode(null)
        } catch (e: any) {
            console.error(e)
            toast.error(`Güncelleme hatası: ${e.message}`)
        } finally {
            setIsUpdatingEpisode(false)
        }
    }

    const handleDeleteEpisodeFromAnime = async (episodeIndex: number) => {
        if (!selectedAnimeForEpisodes) return
        if (!confirm('Bu bölümü silmek istediğinizden emin misiniz?')) return
        setIsUpdatingEpisode(true)
        try {
            const updatedEpisodes = selectedAnimeForEpisodes.episodes.filter((_: any, i: number) => i !== episodeIndex)
            const { error } = await supabase
                .from('animes')
                .update({ episodes: updatedEpisodes, updated_at: new Date().toISOString() })
                .eq('id', selectedAnimeForEpisodes.id)

            if (error) throw error

            setSelectedAnimeForEpisodes((prev: any) => ({ ...prev, episodes: updatedEpisodes }))
            setSupabaseAnimes(prev =>
                prev.map(anime =>
                    anime.id === selectedAnimeForEpisodes.id ? { ...anime, episodes: updatedEpisodes } : anime
                )
            )
            toast.success('Bölüm başarıyla silindi!')
        } catch (e: any) {
            console.error(e)
            toast.error(`Silme hatası: ${e.message}`)
        } finally {
            setIsUpdatingEpisode(false)
        }
    }

    // ─── Save to Supabase (Anilist → DB) ─────────────────────────────────────
    const handleSave = async () => {
        if (!animeDetails || !selectedAnime) return
        setIsSaving(true)
        try {
            const characters = animeDetails.characters?.edges?.map(edge => ({
                id: edge?.node?.id,
                name: edge?.node?.name?.full,
                role: edge?.role,
            })) || []

            const episodes = episodeCollection?.episodes?.map(ep => ({
                number: ep.episodeNumber,
                title: ep.episodeTitle || ep.displayTitle,
                thumbnail: ep.episodeMetadata?.image,
                summary: ep.episodeMetadata?.summary,
                airDate: ep.episodeMetadata?.airDate,
            })) || []

            const recommendations = animeDetails.recommendations?.edges?.map(edge => ({
                id: edge?.node?.mediaRecommendation?.id,
                title: edge?.node?.mediaRecommendation?.title?.english || edge?.node?.mediaRecommendation?.title?.romaji,
                coverImage: edge?.node?.mediaRecommendation?.coverImage?.large,
            })) || []

            const relations = animeDetails.relations?.edges?.map(edge => ({
                id: edge?.node?.id,
                relationType: edge?.relationType,
                title: edge?.node?.title?.english || edge?.node?.title?.romaji,
                type: edge?.node?.type,
                coverImage: edge?.node?.coverImage?.large,
            })) || []

            const staff = animeDetails.staff?.edges?.map(edge => ({
                id: edge?.node?.id,
                name: edge?.node?.name?.full,
                role: edge?.role,
            })) || []

            const studios = animeDetails.studios?.nodes?.map(node => ({
                id: node?.id,
                name: node?.name,
            })) || []

            const trailer = animeDetails.trailer ? {
                id: animeDetails.trailer.id,
                site: animeDetails.trailer.site,
                thumbnail: animeDetails.trailer.thumbnail,
                url: animeDetails.trailer.site === "youtube"
                    ? `https://www.youtube.com/watch?v=${animeDetails.trailer.id}`
                    : animeDetails.trailer.site === "dailymotion"
                        ? `https://www.dailymotion.com/video/${animeDetails.trailer.id}`
                        : null,
            } : null

            const { error } = await supabase.from('animes').upsert({
                anilist_id: animeDetails.id,
                english_name: selectedAnime?.title?.english,
                japanese_name: selectedAnime?.title?.native,
                romaji_name: selectedAnime?.title?.romaji,
                release_date: selectedAnime?.startDate
                    ? `${selectedAnime.startDate.year}-${String(selectedAnime.startDate.month).padStart(2, '0')}-${String(selectedAnime.startDate.day).padStart(2, '0')}`
                    : null,
                is_airing: selectedAnime?.status === 'RELEASING',
                status: selectedAnime?.status,
                description: selectedAnime?.description,
                banner_image: selectedAnime?.bannerImage,
                cover_image: selectedAnime?.coverImage?.extraLarge || selectedAnime?.coverImage?.large,
                genres: selectedAnime?.genres,
                average_score: selectedAnime?.meanScore,
                characters,
                episodes,
                trailer,
                studios,
                staff,
                relations,
                recommendations,
                duration: animeDetails.duration,
                format: selectedAnime?.format,
                synonyms: selectedAnime?.synonyms,
                is_adult: selectedAnime?.isAdult,
                country_of_origin: selectedAnime?.countryOfOrigin,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'anilist_id' })

            if (error) throw error
            toast.success(`${selectedAnime?.title?.english || selectedAnime?.title?.romaji} başarıyla veritabanına eklendi.`)
        } catch (e: any) {
            console.error(e)
            toast.error(`Hata: ${e.message}`)
        } finally {
            setIsSaving(false)
        }
    }

    if (loading) return null

    // ─── Anime Detail View ────────────────────────────────────────────────────
    if (tab === "anime" && selectedAnime) {
        return (
            <div className="min-h-screen bg-[--background]">
                <MediaPageHeader
                    backgroundImage={selectedAnime?.bannerImage}
                    coverImage={selectedAnime?.coverImage?.extraLarge}
                >
                    <MediaPageHeaderDetailsContainer>
                        <MediaPageHeaderEntryDetails
                            coverImage={selectedAnime?.coverImage?.extraLarge || selectedAnime?.coverImage?.large}
                            title={selectedAnime?.title?.userPreferred}
                            color={selectedAnime?.coverImage?.color}
                            englishTitle={selectedAnime?.title?.english}
                            romajiTitle={selectedAnime?.title?.romaji}
                            startDate={selectedAnime?.startDate}
                            season={selectedAnime?.season}
                            progressTotal={selectedAnime?.episodes}
                            status={selectedAnime?.status}
                            description={selectedAnime?.description}
                            media={selectedAnime}
                            type="anime"
                        >
                            <div className="flex gap-3 flex-wrap items-center justify-center lg:justify-start lg:max-w-[65vw]">
                                <MediaEntryAudienceScore meanScore={selectedAnime?.meanScore} badgeClass="bg-transparent" />
                                <AnimeEntryStudio studios={animeDetails?.studios} />
                                <MediaEntryGenresList genres={animeDetails?.genres || selectedAnime?.genres} />
                                <div className="w-full">
                                    <AnimeEntryRankings rankings={animeDetails?.rankings} />
                                </div>
                            </div>
                        </MediaPageHeaderEntryDetails>

                        <div className="flex flex-row w-full gap-3 items-center justify-center lg:justify-start mt-6">
                            <Button
                                intent="primary"
                                size="md"
                                loading={isSaving}
                                onClick={handleSave}
                                leftIcon={<LuVideo />}
                            >
                                Supabase'e Kaydet
                            </Button>
                            {!!animeDetails?.trailer?.id && (
                                <TrailerModal
                                    trailerId={animeDetails.trailer.id}
                                    trigger={
                                        <Button size="md" intent="gray-link" className="px-0 ml-4">
                                            Fragman
                                        </Button>
                                    }
                                />
                            )}
                            <Button
                                intent="white-outline"
                                size="md"
                                className="ml-2"
                                onClick={() => setSelectedId(null)}
                                leftIcon={<LuArrowLeft />}
                            >
                                Geri Dön
                            </Button>
                        </div>
                    </MediaPageHeaderDetailsContainer>
                </MediaPageHeader>

                <div className="px-4 md:px-8 relative z-[8] pb-24">
                    <PageWrapper className="relative 2xl:order-first pb-10">
                        {isLoadingDetails || isLoadingEpisodes ? (
                            <div className="h-64 flex items-center justify-center">
                                <AiOutlineLoading3Quarters className="animate-spin text-4xl text-brand-500" />
                            </div>
                        ) : (
                            <div className="space-y-12 mt-10">
                                {episodeCollection?.episodes && episodeCollection.episodes.length > 0 && (
                                    <div className="space-y-4">
                                        <h2>Bölümler ({episodeCollection.episodes.length})</h2>
                                        <ScrollArea className="w-full whitespace-nowrap pb-4">
                                            <div className="flex gap-4">
                                                {episodeCollection.episodes.slice(0, 15).map(ep => (
                                                    <div key={ep.episodeNumber} className="w-64 flex-shrink-0 group/ep cursor-pointer overflow-hidden rounded-xl border border-white/10 hover:border-brand-500/50 transition-colors">
                                                        <div className="aspect-video relative overflow-hidden">
                                                            <SeaImage
                                                                src={getImageUrl(ep.episodeMetadata?.image || selectedAnime?.bannerImage || selectedAnime?.coverImage?.large || "")}
                                                                alt={`Episode ${ep.episodeNumber}`}
                                                                fill
                                                                placeholder={imageShimmer(700, 475)}
                                                                className="w-full h-full object-cover group-hover/ep:scale-105 transition-transform duration-500"
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 group-hover/ep:bg-transparent transition-colors" />
                                                            <div className="absolute bottom-2 left-2">
                                                                <Badge intent="basic" className="!bg-black/80 font-black text-xs">EP {ep.episodeNumber}</Badge>
                                                            </div>
                                                        </div>
                                                        <div className="p-3 bg-gray-900/50">
                                                            <p className="font-bold text-sm truncate">{ep.episodeTitle || `Episode ${ep.episodeNumber}`}</p>
                                                            {ep.episodeMetadata?.airDate && <p className="text-[10px] text-gray-500 uppercase mt-0.5">{new Date(ep.episodeMetadata.airDate).toLocaleDateString()}</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                                {episodeCollection.episodes.length > 15 && (
                                                    <div className="w-32 flex-shrink-0 flex items-center justify-center bg-white/5 rounded-xl border border-white/10">
                                                        <p className="text-sm font-bold text-gray-400">+{episodeCollection.episodes.length - 15} Bölüm</p>
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                )}

                                <MediaEntryCharactersSection details={animeDetails} />
                                <RelationsRecommendationsSection entry={{ mediaId: selectedAnime.id } as Anime_Entry} details={animeDetails} />
                            </div>
                        )}
                    </PageWrapper>
                </div>
            </div>
        )
    }

    // ─── Main Panel ───────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-950">
            <CustomLibraryBanner discrete />

            <PageWrapper className="p-4 sm:p-8 max-w-[1600px] mx-auto pb-24 relative z-[10]">
                <div className="mb-12 space-y-2 mt-4">
                    <div className="flex items-center gap-4 text-brand-400 mb-2">
                        <LuShieldCheck className="text-3xl" />
                        <span className="text-sm font-black uppercase tracking-[0.3em]">Fansub Kontrol Paneli</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">
                        İçerik <span className="bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">Yönetimi</span>
                    </h1>
                </div>

                <Tabs
                    value={tab}
                    onValueChange={setTab}
                    className="grid grid-cols-1 lg:grid-cols-[250px,1fr] gap-10 items-start"
                >
                    <TabsList className="flex flex-col h-auto bg-transparent border-none p-0 space-y-2 sticky top-10">
                        <NavButton value="dashboard" icon={<LuLayoutDashboard />} label="Dashboard" />
                        <NavButton value="anime" icon={<LuVideo />} label="Anime Ekle" />
                        <NavButton value="edit" icon={<LuListVideo />} label="Anime Düzenle" />
                        <NavButton value="episodes" icon={<LuListVideo />} label="Bölüm Yönetimi" />

                        <div className="mt-8 p-6 rounded-xl bg-gradient-to-br from-brand-500/10 to-brand-900/10 border border-brand-500/20">
                            <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-3">Kullanıcı</p>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white font-black text-xs">
                                    {user?.email?.[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-white truncate">{user?.email}</p>
                                    <Badge intent="success-solid" size="sm" className="mt-1 font-black">FANSUB</Badge>
                                </div>
                            </div>
                        </div>
                    </TabsList>

                    <div className="min-w-0 bg-[--background] border border-white/5 rounded-2xl p-6 md:p-10 shadow-2xl">
                        {/* ── Dashboard ── */}
                        <TabsContent value="dashboard" className={tabContentClass}>
                            <h2 className="text-3xl font-black mb-8">Genel Durum</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <StatsCard title="Toplam Anime" value={stats.animes.toString()} icon={<LuVideo />} color="brand" />
                                <StatsCard title="Yüklenen Bölüm" value="0" icon={<LuListVideo />} color="blue" />
                                <StatsCard title="Aktif Çevirmen" value="1" icon={<LuUsers />} color="green" />
                            </div>
                        </TabsContent>

                        {/* ── Anime Ekle ── */}
                        <TabsContent value="anime" className={tabContentClass}>
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-2xl font-black text-white">Yeni Anime Ekle</h3>
                                    <p className="text-gray-400 text-sm mt-1">Anilist üzerinden arama yaparak animeyi Fansub sistemine aktarabilirsiniz.</p>
                                </div>

                                <div className="relative max-w-2xl">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                                        <BiSearch className="text-xl" />
                                    </div>
                                    <TextInput
                                        placeholder="Anime adını arayın..."
                                        className="pl-12 h-14 text-base rounded-xl bg-white/5 border-white/10 focus:border-brand-500 transition-all shadow-xl"
                                        value={animeSearch}
                                        onValueChange={setAnimeSearch}
                                    />
                                    {isSearching && (
                                        <div className="absolute right-4 inset-y-0 flex items-center">
                                            <AiOutlineLoading3Quarters className="animate-spin text-brand-500 text-xl" />
                                        </div>
                                    )}
                                </div>

                                {searchResults?.Page?.media && searchResults.Page.media.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 pt-4">
                                        {searchResults.Page.media.map(anime => (
                                            <div
                                                key={anime.id}
                                                className={cn(
                                                    "group relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300 border-2 shadow-lg",
                                                    selectedId === anime.id ? "border-brand-500 scale-95" : "border-transparent hover:border-brand-500/50 hover:-translate-y-1"
                                                )}
                                                onClick={() => setSelectedId(anime.id)}
                                            >
                                                <div className="w-full aspect-[2/3] relative">
                                                    <SeaImage
                                                        src={getImageUrl(anime.coverImage?.large || "")}
                                                        alt={anime.title?.english || anime.title?.romaji || ""}
                                                        fill
                                                        placeholder={imageShimmer(700, 475)}
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                                    <p className="text-white text-xs font-black line-clamp-2">{anime.title?.english || anime.title?.romaji}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* ── Bölüm Yönetimi ── */}
                        <TabsContent value="episodes" className={tabContentClass}>
                            {selectedAnimeForEpisodes ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-2xl font-black text-white">Bölüm Yönetimi</h3>
                                            <p className="text-gray-400 text-sm mt-1">{selectedAnimeForEpisodes.english_name || selectedAnimeForEpisodes.romaji_name}</p>
                                        </div>
                                        <Button
                                            intent="white-outline"
                                            size="sm"
                                            onClick={() => setSelectedAnimeForEpisodes(null)}
                                            leftIcon={<LuArrowLeft />}
                                        >
                                            Geri
                                        </Button>
                                    </div>

                                    <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                        <div className="w-20 h-30 relative rounded-lg overflow-hidden flex-shrink-0">
                                            <SeaImage
                                                src={getImageUrl(selectedAnimeForEpisodes.cover_image || "")}
                                                alt={selectedAnimeForEpisodes.english_name || selectedAnimeForEpisodes.romaji_name}
                                                fill
                                                placeholder={imageShimmer(700, 475)}
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-white text-lg mb-2">
                                                {selectedAnimeForEpisodes.english_name || selectedAnimeForEpisodes.romaji_name}
                                            </h4>
                                            <div className="flex gap-2 mb-3">
                                                <Badge intent="primary-solid" className="text-xs font-black">
                                                    {selectedAnimeForEpisodes.episodes?.length || 0} Bölüm
                                                </Badge>
                                                <Badge intent="gray" className="text-xs">
                                                    {selectedAnimeForEpisodes.status || 'Bilinmiyor'}
                                                </Badge>
                                            </div>
                                            <p className="text-gray-400 text-sm line-clamp-3">
                                                {selectedAnimeForEpisodes.description?.replace(/<[^>]*>/g, '') || 'Açıklama yok'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="relative max-w-md">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                                            <BiSearch className="text-lg" />
                                        </div>
                                        <TextInput
                                            placeholder="Bölüm ara..."
                                            className="pl-12 h-12 text-sm rounded-xl bg-white/5 border-white/10 focus:border-brand-500 transition-all"
                                            value={episodeSearch}
                                            onValueChange={setEpisodeSearch}
                                        />
                                    </div>

                                    {selectedAnimeForEpisodes.episodes && selectedAnimeForEpisodes.episodes.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {selectedAnimeForEpisodes.episodes
                                                .filter((episode: any) =>
                                                    !episodeSearch ||
                                                    episode.title?.toLowerCase().includes(episodeSearch.toLowerCase()) ||
                                                    episode.number?.toString().includes(episodeSearch)
                                                )
                                                .map((episode: any, index: number) => (
                                                    <div
                                                        key={index}
                                                        className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-brand-500/50 transition-all hover:-translate-y-1 shadow-lg"
                                                    >
                                                        <div className="aspect-video relative overflow-hidden">
                                                            <SeaImage
                                                                src={getImageUrl(episode.thumbnail || selectedAnimeForEpisodes.banner_image || selectedAnimeForEpisodes.cover_image || "")}
                                                                alt={`Episode ${episode.number}`}
                                                                fill
                                                                placeholder={imageShimmer(700, 475)}
                                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                                                            <div className="absolute bottom-2 left-2">
                                                                <Badge intent="primary-solid" className="font-black text-xs">
                                                                    Bölüm {episode.number}
                                                                </Badge>
                                                            </div>
                                                            <div className="absolute top-2 right-2">
                                                                <Button
                                                                    intent="white"
                                                                    size="sm"
                                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    leftIcon={<LuPencil />}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleEditEpisode(episode, index)
                                                                    }}
                                                                >
                                                                    Düzenle
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="p-4 bg-gray-900/50">
                                                            <h5 className="font-bold text-white text-sm mb-1 line-clamp-1">
                                                                {episode.title || `Bölüm ${episode.number}`}
                                                            </h5>
                                                            {episode.airDate && (
                                                                <p className="text-gray-400 text-xs mb-2">
                                                                    {new Date(episode.airDate).toLocaleDateString('tr-TR')}
                                                                </p>
                                                            )}
                                                            {episode.summary && (
                                                                <p className="text-gray-400 text-xs line-clamp-2">
                                                                    {episode.summary}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="py-20 text-center space-y-4">
                                            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-500">
                                                <LuListVideo size={32} />
                                            </div>
                                            <p className="text-gray-400">Bu anime için henüz bölüm yok</p>
                                            <Button
                                                intent="primary-outline"
                                                onClick={() => {
                                                    setEditingAnime(selectedAnimeForEpisodes)
                                                    setTab("edit")
                                                }}
                                            >
                                                Bölüm Ekle
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-white">Bölüm Yönetimi</h3>
                                        <p className="text-gray-400 text-sm mt-1">Veritabanınızdaki animelerin bölümlerini yönetin</p>
                                    </div>

                                    <div className="relative max-w-2xl">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                                            <BiSearch className="text-xl" />
                                        </div>
                                        <TextInput
                                            placeholder="Anime ara..."
                                            className="pl-12 h-14 text-base rounded-xl bg-white/5 border-white/10 focus:border-brand-500 transition-all shadow-xl"
                                            value={episodesAnimeSearch}
                                            onValueChange={setEpisodesAnimeSearch}
                                        />
                                    </div>

                                    {isLoadingAnimes ? (
                                        <div className="h-64 flex items-center justify-center">
                                            <AiOutlineLoading3Quarters className="animate-spin text-4xl text-brand-500" />
                                        </div>
                                    ) : supabaseAnimes.length === 0 ? (
                                        <div className="py-20 text-center space-y-4">
                                            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-500">
                                                <LuListVideo size={40} />
                                            </div>
                                            <p className="text-gray-400">Henüz veritabanında anime yok</p>
                                            <Button intent="primary-outline" onClick={() => setTab("anime")}>Anime Ekle</Button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {supabaseAnimes
                                                .filter(anime =>
                                                    !episodesAnimeSearch ||
                                                    anime.english_name?.toLowerCase().includes(episodesAnimeSearch.toLowerCase()) ||
                                                    anime.romaji_name?.toLowerCase().includes(episodesAnimeSearch.toLowerCase()) ||
                                                    anime.japanese_name?.toLowerCase().includes(episodesAnimeSearch.toLowerCase())
                                                )
                                                .map(anime => (
                                                    <div
                                                        key={anime.id}
                                                        className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-brand-500/50 transition-all hover:-translate-y-1 shadow-lg cursor-pointer"
                                                        onClick={() => setSelectedAnimeForEpisodes(anime)}
                                                    >
                                                        <div className="flex gap-4 p-4">
                                                            <div className="w-16 h-24 relative rounded-lg overflow-hidden flex-shrink-0">
                                                                <SeaImage
                                                                    src={getImageUrl(anime.cover_image || "")}
                                                                    alt={anime.english_name || anime.romaji_name}
                                                                    fill
                                                                    placeholder={imageShimmer(700, 475)}
                                                                    className="object-cover"
                                                                />
                                                                {anime.is_4k && (
                                                                    <div className="absolute top-1 left-1 z-[5]">
                                                                        <div className="bg-gradient-to-br from-cyan-400 to-teal-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg border border-white/20">
                                                                            4K
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-bold text-white text-sm line-clamp-2 mb-2">
                                                                    {anime.english_name || anime.romaji_name}
                                                                </h4>
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge intent="primary-solid" className="text-[10px] font-black">
                                                                            {anime.episodes?.length || 0} Bölüm
                                                                        </Badge>
                                                                        <Badge intent="gray" className="text-[10px]">
                                                                            {anime.status || 'Bilinmiyor'}
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-gray-400 text-xs line-clamp-2">
                                                                        {anime.description?.replace(/<[^>]*>/g, '') || 'Açıklama yok'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-brand-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                ))}

                                            {/* Episodes tab — no infinite scroll needed (same data, client-side filtered) */}
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        {/* ── Anime Düzenle ── */}
                        <TabsContent value="edit" className={tabContentClass}>
                            {editingAnime ? (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-2xl font-black text-white">Anime Düzenle</h3>
                                            <p className="text-gray-400 text-sm mt-1">Anime bilgilerini ve bölümlerini düzenleyin</p>
                                        </div>
                                        <Button
                                            intent="white-outline"
                                            size="sm"
                                            onClick={() => setEditingAnime(null)}
                                            leftIcon={<LuArrowLeft />}
                                        >
                                            Geri
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">İngilizce Adı</label>
                                                <TextInput
                                                    value={editForm.english_name || ''}
                                                    onValueChange={(v) => setEditForm((prev: any) => ({ ...prev, english_name: v }))}
                                                    className="bg-white/5 border-white/10"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Japonca Adı</label>
                                                <TextInput
                                                    value={editForm.japanese_name || ''}
                                                    onValueChange={(v) => setEditForm((prev: any) => ({ ...prev, japanese_name: v }))}
                                                    className="bg-white/5 border-white/10"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Romaji Adı</label>
                                                <TextInput
                                                    value={editForm.romaji_name || ''}
                                                    onValueChange={(v) => setEditForm((prev: any) => ({ ...prev, romaji_name: v }))}
                                                    className="bg-white/5 border-white/10"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Açıklama</label>
                                                <Textarea
                                                    value={editForm.description || ''}
                                                    onChange={(e) => setEditForm((prev: any) => ({ ...prev, description: e.target.value }))}
                                                    className="bg-white/5 border-white/10 min-h-[120px]"
                                                />
                                            </div>
                                            <div className="pt-2">
                                                <Checkbox
                                                    label="4K Desteği"
                                                    value={editForm.is_4k}
                                                    onValueChange={(v) => setEditForm((prev: any) => ({ ...prev, is_4k: v }))}
                                                    labelClass="text-sm font-bold text-teal-500 uppercase tracking-wider"
                                                />
                                                <p className="text-[10px] text-gray-500 mt-1 ml-7">Bu animeyi 4K kalitesinde bölümleri olduğunu belirterek öne çıkarır.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Banner Resmi URL</label>
                                                <TextInput
                                                    value={editForm.banner_image || ''}
                                                    onValueChange={(v) => setEditForm((prev: any) => ({ ...prev, banner_image: v }))}
                                                    className="bg-white/5 border-white/10"
                                                />
                                                {editForm.banner_image && (
                                                    <div className="mt-2 w-full h-32 relative rounded-lg overflow-hidden">
                                                        <SeaImage
                                                            src={getImageUrl(editForm.banner_image)}
                                                            alt="Banner"
                                                            fill
                                                            placeholder={imageShimmer(700, 475)}
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Kapak Resmi URL</label>
                                                <TextInput
                                                    value={editForm.cover_image || ''}
                                                    onValueChange={(v) => setEditForm((prev: any) => ({ ...prev, cover_image: v }))}
                                                    className="bg-white/5 border-white/10"
                                                />
                                                {editForm.cover_image && (
                                                    <div className="mt-2 w-32 h-48 relative rounded-lg overflow-hidden">
                                                        <SeaImage
                                                            src={getImageUrl(editForm.cover_image)}
                                                            alt="Cover"
                                                            fill
                                                            placeholder={imageShimmer(700, 475)}
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-white/10 pt-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-xl font-black text-white">Bölümler ({editForm.episodes?.length || 0})</h4>
                                            <Button
                                                intent="primary"
                                                size="sm"
                                                onClick={handleAddEpisode}
                                                leftIcon={<LuPlus />}
                                            >
                                                Bölüm Ekle
                                            </Button>
                                        </div>

                                        <ScrollArea className="h-[400px] pr-4">
                                            <div className="space-y-4">
                                                {editForm.episodes?.map((episode: any, index: number) => (
                                                    <div key={index} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <Badge intent="primary-solid" className="font-black">Bölüm {episode.number}</Badge>
                                                                <TextInput
                                                                    value={episode.number?.toString() || ''}
                                                                    onValueChange={(v) => handleUpdateEpisode(index, 'number', parseInt(v) || 1)}
                                                                    className="bg-white/5 border-white/10 text-sm w-20"
                                                                    placeholder="#"
                                                                    type="number"
                                                                />
                                                            </div>
                                                            <Button
                                                                intent="alert-subtle"
                                                                size="sm"
                                                                onClick={() => handleDeleteEpisode(index)}
                                                                leftIcon={<LuTrash2 />}
                                                            >
                                                                Sil
                                                            </Button>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Başlık</label>
                                                                <TextInput
                                                                    value={episode.title || ''}
                                                                    onValueChange={(v) => handleUpdateEpisode(index, 'title', v)}
                                                                    className="bg-white/5 border-white/10 text-sm"
                                                                    placeholder="Bölüm başlığı"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Yayın Tarihi</label>
                                                                <TextInput
                                                                    value={episode.airDate || ''}
                                                                    onValueChange={(v) => handleUpdateEpisode(index, 'airDate', v)}
                                                                    className="bg-white/5 border-white/10 text-sm"
                                                                    placeholder="YYYY-MM-DD"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Thumbnail URL</label>
                                                            <TextInput
                                                                value={episode.thumbnail || ''}
                                                                onValueChange={(v) => handleUpdateEpisode(index, 'thumbnail', v)}
                                                                className="bg-white/5 border-white/10 text-sm"
                                                                placeholder="https://..."
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Özet</label>
                                                            <Textarea
                                                                value={episode.summary || ''}
                                                                onChange={(e) => handleUpdateEpisode(index, 'summary', e.target.value)}
                                                                className="bg-white/5 border-white/10 text-sm min-h-[60px]"
                                                                placeholder="Bölüm özeti..."
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-white/10">
                                        <Button
                                            intent="success"
                                            size="lg"
                                            loading={isSaving}
                                            onClick={handleUpdateAnime}
                                            leftIcon={<LuSave />}
                                            className="flex-1"
                                        >
                                            Değişiklikleri Kaydet
                                        </Button>
                                        <Button
                                            intent="alert"
                                            size="lg"
                                            loading={isDeleting}
                                            onClick={() => handleDeleteAnime(editingAnime.id)}
                                            leftIcon={<LuTrash2 />}
                                        >
                                            Animeyi Sil
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-white">Anime Düzenle</h3>
                                        <p className="text-gray-400 text-sm mt-1">Veritabanınızdaki animeleri düzenleyin veya silin</p>
                                    </div>

                                    <div className="relative max-w-2xl">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                                            <BiSearch className="text-xl" />
                                        </div>
                                        <TextInput
                                            placeholder="Anime ara..."
                                            className="pl-12 h-14 text-base rounded-xl bg-white/5 border-white/10 focus:border-brand-500 transition-all shadow-xl"
                                            value={editAnimeSearch}
                                            onValueChange={setEditAnimeSearch}
                                        />
                                    </div>

                                    {isLoadingAnimes ? (
                                        <div className="h-64 flex items-center justify-center">
                                            <AiOutlineLoading3Quarters className="animate-spin text-4xl text-brand-500" />
                                        </div>
                                    ) : supabaseAnimes.length === 0 ? (
                                        <div className="py-20 text-center space-y-4">
                                            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto text-gray-500">
                                                <LuVideo size={40} />
                                            </div>
                                            <p className="text-gray-400">Henüz veritabanında anime yok</p>
                                            <Button intent="primary-outline" onClick={() => setTab("anime")}>Anime Ekle</Button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                                            {supabaseAnimes
                                                .filter(anime =>
                                                    !editAnimeSearch ||
                                                    anime.english_name?.toLowerCase().includes(editAnimeSearch.toLowerCase()) ||
                                                    anime.romaji_name?.toLowerCase().includes(editAnimeSearch.toLowerCase()) ||
                                                    anime.japanese_name?.toLowerCase().includes(editAnimeSearch.toLowerCase())
                                                )
                                                .map(anime => (
                                                    <div
                                                        key={anime.id}
                                                        className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-brand-500/50 transition-all hover:-translate-y-1 shadow-lg"
                                                    >
                                                        <img
                                                            src={anime.cover_image || ""}
                                                            className="w-full aspect-[2/3] object-cover"
                                                            alt={anime.english_name || anime.romaji_name}
                                                        />
                                                        {anime.is_4k && (
                                                            <div className="absolute top-2 left-2 z-[5]">
                                                                <div className="bg-gradient-to-br from-cyan-400 to-teal-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-lg border border-white/20">
                                                                    4K
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                                                                <p className="text-white text-xs font-black line-clamp-2">
                                                                    {anime.english_name || anime.romaji_name}
                                                                </p>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        intent="white"
                                                                        size="sm"
                                                                        onClick={() => handleEditAnime(anime)}
                                                                        leftIcon={<LuPencil />}
                                                                        className="flex-1 text-xs"
                                                                    >
                                                                        Düzenle
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="absolute top-2 right-2">
                                                            <Badge intent="primary-solid" className="text-[10px] font-black">
                                                                {anime.episodes?.length || 0} Bölüm
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}

                                            {/* Infinite scroll trigger — edit tab only */}
                                            <div ref={editObserverTarget} className="col-span-full h-20 flex items-center justify-center">
                                                {editIsLoadingMore && (
                                                    <div className="flex items-center gap-3 text-brand-500">
                                                        <AiOutlineLoading3Quarters className="animate-spin text-2xl" />
                                                        <span className="text-sm font-bold">Daha fazla yükleniyor...</span>
                                                    </div>
                                                )}
                                                {!editHasMore && supabaseAnimes.length > 0 && (
                                                    <p className="text-gray-500 text-sm">Tüm animeler yüklendi</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </PageWrapper>

            {/* ── Episode Edit Modal ── */}
            <Modal
                open={!!editingEpisode}
                onOpenChange={(open) => !open && setEditingEpisode(null)}
                title="Bölüm Düzenle"
                contentClass="max-w-[95vw] w-full h-[95vh] max-h-[95vh] p-0"
            >
                {editingEpisode && (
                    <div className="flex flex-col h-full">
                        <div className="flex items-center gap-4 p-6 bg-white/5 border-b border-white/10 flex-shrink-0">
                            <div className="w-16 h-24 relative rounded-lg overflow-hidden flex-shrink-0">
                                <SeaImage
                                    src={getImageUrl(episodeEditForm.thumbnail || selectedAnimeForEpisodes?.banner_image || selectedAnimeForEpisodes?.cover_image || "")}
                                    alt={`Episode ${episodeEditForm.number}`}
                                    fill
                                    placeholder={imageShimmer(700, 475)}
                                    className="object-cover"
                                />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-lg">Bölüm {episodeEditForm.number}</h4>
                                <p className="text-gray-400 text-sm">
                                    {selectedAnimeForEpisodes?.english_name || selectedAnimeForEpisodes?.romaji_name}
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <h5 className="text-lg font-bold text-white border-b border-white/10 pb-2">Temel Bilgiler</h5>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Bölüm Numarası</label>
                                        <TextInput
                                            type="number"
                                            value={episodeEditForm.number?.toString() || ''}
                                            onValueChange={(v) => setEpisodeEditForm((prev: any) => ({ ...prev, number: parseInt(v) || 1 }))}
                                            className="bg-white/5 border-white/10"
                                            placeholder="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Başlık</label>
                                        <TextInput
                                            value={episodeEditForm.title || ''}
                                            onValueChange={(v) => setEpisodeEditForm((prev: any) => ({ ...prev, title: v }))}
                                            className="bg-white/5 border-white/10"
                                            placeholder="Bölüm başlığı"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Yayın Tarihi</label>
                                        <TextInput
                                            type="date"
                                            value={episodeEditForm.airDate || ''}
                                            onValueChange={(v) => setEpisodeEditForm((prev: any) => ({ ...prev, airDate: v }))}
                                            className="bg-white/5 border-white/10"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Süre (dakika)</label>
                                        <TextInput
                                            type="number"
                                            value={episodeEditForm.duration || ''}
                                            onValueChange={(v) => setEpisodeEditForm((prev: any) => ({ ...prev, duration: v }))}
                                            className="bg-white/5 border-white/10"
                                            placeholder="24"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Durum</label>
                                        <Select
                                            value={episodeEditForm.status || 'available'}
                                            onValueChange={(v) => setEpisodeEditForm((prev: any) => ({ ...prev, status: v }))}
                                            options={[
                                                { value: 'available', label: 'Mevcut' },
                                                { value: 'processing', label: 'İşleniyor' },
                                                { value: 'coming_soon', label: 'Yakında' },
                                                { value: 'unavailable', label: 'Mevcut Değil' },
                                            ]}
                                            fieldClass="bg-white/5 border-white/10"
                                        />
                                    </div>
                                </div>

                                {/* Media & Technical */}
                                <div className="space-y-4">
                                    <h5 className="text-lg font-bold text-white border-b border-white/10 pb-2">Medya & Teknik</h5>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Thumbnail URL</label>
                                        <TextInput
                                            value={episodeEditForm.thumbnail || ''}
                                            onValueChange={(v) => setEpisodeEditForm((prev: any) => ({ ...prev, thumbnail: v }))}
                                            className="bg-white/5 border-white/10"
                                            placeholder="https://..."
                                        />
                                        {episodeEditForm.thumbnail && (
                                            <div className="mt-2 w-full h-32 relative rounded-lg overflow-hidden">
                                                <SeaImage
                                                    src={getImageUrl(episodeEditForm.thumbnail)}
                                                    alt="Thumbnail Preview"
                                                    fill
                                                    placeholder={imageShimmer(700, 475)}
                                                    className="object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Video Kaynakları (SomeSub)</label>
                                            <Button
                                                size="xs"
                                                intent="primary-subtle"
                                                onClick={() => {
                                                    const sources = [...(episodeEditForm.video_sources || [])]
                                                    sources.push({ name: '', url: '' })
                                                    setEpisodeEditForm((prev: any) => ({ ...prev, video_sources: sources }))
                                                }}
                                                leftIcon={<LuPlus />}
                                            >
                                                Ekle
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            {(episodeEditForm.video_sources || []).map((source: any, idx: number) => (
                                                <div key={idx} className="flex flex-col gap-2 p-3 bg-white/5 rounded-lg border border-white/10 relative group">
                                                    <div className="flex gap-2">
                                                        <TextInput
                                                            placeholder="Sunucu Adı (örn: Google Drive)"
                                                            value={source.name}
                                                            onValueChange={(v) => {
                                                                const sources = [...episodeEditForm.video_sources]
                                                                sources[idx].name = v
                                                                setEpisodeEditForm((prev: any) => ({ ...prev, video_sources: sources }))
                                                            }}
                                                            className="text-xs h-8 bg-transparent border-white/10"
                                                        />
                                                        <Button
                                                            size="xs"
                                                            intent="alert-subtle"
                                                            className="h-8 px-2"
                                                            onClick={() => {
                                                                const sources = episodeEditForm.video_sources.filter((_: any, i: number) => i !== idx)
                                                                setEpisodeEditForm((prev: any) => ({ ...prev, video_sources: sources }))
                                                            }}
                                                        >
                                                            <LuTrash2 />
                                                        </Button>
                                                    </div>
                                                    <TextInput
                                                        placeholder="Video/Embed URL"
                                                        value={source.url}
                                                        onValueChange={(v) => {
                                                            const sources = [...episodeEditForm.video_sources]
                                                            sources[idx].url = v
                                                            setEpisodeEditForm((prev: any) => ({ ...prev, video_sources: sources }))
                                                        }}
                                                        className="text-xs h-8 bg-transparent border-white/10"
                                                    />
                                                </div>
                                            ))}
                                            {(episodeEditForm.video_sources || []).length === 0 && (
                                                <div className="text-[10px] text-gray-500 italic text-center py-2 border border-dashed border-white/10 rounded-lg">
                                                    Henüz özel kaynak eklenmedi. "SomeSub" sağlayıcısı için burayı kullanın.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Kalite</label>
                                            <Select
                                                value={episodeEditForm.quality || '1080p'}
                                                onValueChange={(v) => setEpisodeEditForm((prev: any) => ({ ...prev, quality: v }))}
                                                options={[
                                                    { value: '480p', label: '480p' },
                                                    { value: '720p', label: '720p' },
                                                    { value: '1080p', label: '1080p' },
                                                    { value: '1440p', label: '1440p' },
                                                    { value: '4K', label: '4K' },
                                                ]}
                                                fieldClass="bg-white/5 border-white/10"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Dosya Boyutu</label>
                                            <TextInput
                                                value={episodeEditForm.fileSize || ''}
                                                onValueChange={(v) => setEpisodeEditForm((prev: any) => ({ ...prev, fileSize: v }))}
                                                className="bg-white/5 border-white/10"
                                                placeholder="1.2 GB"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Subtitles */}
                                <div className="space-y-4">
                                    <h5 className="text-lg font-bold text-white border-b border-white/10 pb-2">Alt Yazılar</h5>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                                            Alt Yazı Gecikmesi (saniye)
                                        </label>
                                        <TextInput
                                            type="number"
                                            step="0.1"
                                            value={episodeEditForm.subtitleDelay?.toString() || '0'}
                                            onValueChange={(v) => setEpisodeEditForm((prev: any) => ({ ...prev, subtitleDelay: parseFloat(v) || 0 }))}
                                            className="bg-white/5 border-white/10"
                                            placeholder="0"
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            Pozitif değerler altyazıları geciktirir, negatif değerler ilerletir. Bu ayar video oynatıcıda otomatik olarak uygulanır.
                                        </p>
                                    </div>
                                    <SubtitleUpload
                                        anilistId={selectedAnimeForEpisodes?.anilist_id || 0}
                                        episodeNumber={episodeEditForm.number || 1}
                                        existingSubtitles={episodeEditForm.subtitles || []}
                                        onSubtitlesChange={(subtitles) => {
                                            setEpisodeEditForm((prev: any) => ({ ...prev, subtitles }))
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Özet</label>
                                <Textarea
                                    value={episodeEditForm.summary || ''}
                                    onChange={(e) => setEpisodeEditForm((prev: any) => ({ ...prev, summary: e.target.value }))}
                                    className="bg-white/5 border-white/10 min-h-[100px]"
                                    placeholder="Bölüm özeti..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 p-6 border-t border-white/10 flex-shrink-0">
                            <Button
                                intent="success"
                                size="lg"
                                loading={isUpdatingEpisode}
                                onClick={handleUpdateEpisodeInAnime}
                                leftIcon={<LuSave />}
                                className="flex-1"
                            >
                                Değişiklikleri Kaydet
                            </Button>
                            <Button
                                intent="alert"
                                size="lg"
                                loading={isUpdatingEpisode}
                                onClick={() => {
                                    if (confirm('Bu bölümü silmek istediğinizden emin misiniz?')) {
                                        handleDeleteEpisodeFromAnime(editingEpisode.originalIndex)
                                        setEditingEpisode(null)
                                    }
                                }}
                                leftIcon={<LuTrash2 />}
                            >
                                Bölümü Sil
                            </Button>
                            <Button
                                intent="gray-outline"
                                size="lg"
                                onClick={() => setEditingEpisode(null)}
                            >
                                İptal
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}

function NavButton({ value, icon, label }: { value: string; icon: React.ReactNode; label: string }) {
    return (
        <TabsTrigger
            value={value}
            className="w-full h-12 justify-start px-4 rounded-xl text-gray-400 data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all font-bold hover:bg-white/5 hover:text-white"
        >
            <span className="text-lg mr-3">{icon}</span> {label}
        </TabsTrigger>
    )
}

function StatsCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: "brand" | "blue" | "green" }) {
    const colors = {
        brand: "bg-brand-500/10 text-brand-500",
        blue: "bg-blue-500/10 text-blue-500",
        green: "bg-green-500/10 text-green-500",
    }
    return (
        <Card className={cn("p-6 rounded-2xl border-none shadow-md", colors[color])}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-xl">{icon}</span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{title}</span>
            </div>
            <p className="text-3xl font-black">{value}</p>
        </Card>
    )
}