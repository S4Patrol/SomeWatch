"use client"

import { useAnilistListAnime, useGetAnilistAnimeDetails } from "@/api/hooks/anilist.hooks"
import { useGetAnimeEpisodeCollection } from "@/api/hooks/anime.hooks"
import { AppLayoutStack } from "@/components/ui/app-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { TextInput } from "@/components/ui/text-input"
import { useDebounce } from "@/hooks/use-debounce"
import { supabase } from "@/lib/supabase/client"
import React from "react"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { BiSearch } from "react-icons/bi"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function AnimeManagementPage() {
    const [search, setSearch] = React.useState("")
    const debouncedSearch = useDebounce(search, 500)
    const [selectedId, setSelectedId] = React.useState<number | null>(null)
    const [isSaving, setIsSaving] = React.useState(false)

    // Anilist search results
    const { data: searchResults, isFetching: isSearching } = useAnilistListAnime({
        search: debouncedSearch,
        page: 1,
        perPage: 10,
    }, !!debouncedSearch)

    // Detailed info for selected anime
    const { data: animeDetails, isFetching: isLoadingDetails } = useGetAnilistAnimeDetails(selectedId)
    const { data: episodeCollection, isFetching: isLoadingEpisodes } = useGetAnimeEpisodeCollection(selectedId)
    
    const selectedAnime = React.useMemo(() => searchResults?.Page?.media?.find(m => m?.id === selectedId), [searchResults, selectedId]);

    const handleSave = async () => {
        if (!animeDetails) return

        setIsSaving(true)
        try {
            const characters = animeDetails.characters?.edges?.map(edge => ({
                id: edge?.node?.id,
                name: edge?.node?.name?.full,
                role: edge?.role,
                image: edge?.node?.image?.large,
            })) || []

            const episodes = episodeCollection?.episodes?.map(ep => ({
                number: ep.episodeNumber,
                title: ep.episodeTitle || ep.displayTitle,
                thumbnail: ep.episodeMetadata?.image,
                summary: ep.episodeMetadata?.summary,
                airDate: ep.episodeMetadata?.airDate,
            })) || []

            const { error } = await supabase.from('animes').upsert({
                anilist_id: animeDetails.id,
                english_name: selectedAnime?.title?.english,
                japanese_name: selectedAnime?.title?.native,
                romaji_name: selectedAnime?.title?.romaji,
                release_date: selectedAnime?.startDate ? `${selectedAnime.startDate.year}-${String(selectedAnime.startDate.month).padStart(2, '0')}-${String(selectedAnime.startDate.day).padStart(2, '0')}` : null,
                is_airing: selectedAnime?.status === 'RELEASING',
                status: selectedAnime?.status,
                description: selectedAnime?.description,
                banner_image: selectedAnime?.bannerImage,
                cover_image: selectedAnime?.coverImage?.extraLarge || selectedAnime?.coverImage?.large,
                genres: selectedAnime?.genres,
                average_score: selectedAnime?.meanScore,
                characters: characters,
                episodes: episodes,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'anilist_id' })

            if (error) throw error
            toast.success(`${selectedAnime?.title?.english || selectedAnime?.title?.romaji} başarıyla kaydedildi.`)
        } catch (e: any) {
            console.error(e)
            toast.error(`Kaydedilemedi: ${e.message}`)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <AppLayoutStack className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-20">
            <div className="space-y-2 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
                    Anime Yönetimi
                </h1>
                <p className="text-muted-foreground text-lg">Anilist üzerinden anime bilgilerini çekin ve veritabanına kaydedin.</p>
            </div>

            <div className="relative group max-w-2xl mx-auto md:mx-0">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-500">
                    <BiSearch className="text-2xl" />
                </div>
                <TextInput
                    placeholder="Anime adını girin (Örn: One Piece, Attack on Titan...)"
                    className="pl-12 h-16 text-xl rounded-2xl border-2 transition-all focus:ring-4 focus:ring-brand-500/20 shadow-lg"
                    value={search}
                    onValueChange={setSearch}
                />
                {isSearching && (
                    <div className="absolute right-4 inset-y-0 flex items-center">
                        <AiOutlineLoading3Quarters className="animate-spin text-brand-500 text-2xl" />
                    </div>
                )}
            </div>

            {searchResults?.Page?.media && searchResults.Page.media.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    {searchResults.Page.media.map(anime => (
                        <Card
                            key={anime.id}
                            className={`group relative overflow-hidden cursor-pointer transition-all border-2 ${selectedId === anime.id ? 'border-brand-500 ring-4 ring-brand-500/20 shadow-brand-500/10' : 'hover:border-brand-400/50 border-transparent shadow-sm'}`}
                            onClick={() => setSelectedId(anime.id)}
                        >
                            <img
                                src={anime.coverImage?.large || ""}
                                alt={anime.title?.english || ""}
                                className="w-full aspect-[2/3] object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                <p className="text-white text-xs font-black line-clamp-2 uppercase tracking-widest leading-tight">
                                    {anime.title?.english || anime.title?.romaji}
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {selectedId && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 animate-in fade-in zoom-in-95 duration-500">
                    <Card className="lg:col-span-2 overflow-hidden border-none shadow-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-800">
                        {isLoadingDetails ? (
                            <div className="h-96 flex items-center justify-center">
                                <AiOutlineLoading3Quarters className="animate-spin text-4xl text-brand-500" />
                            </div>
                        ) : animeDetails ? (
                            <div className="relative">
                                <div className="h-64 relative overflow-hidden">
                                    <img src={selectedAnime?.bannerImage || selectedAnime?.coverImage?.extraLarge || ""} className="w-full h-full object-cover blur-[2px] opacity-50" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-900 via-transparent to-transparent" />
                                </div>

                                <div className="px-6 md:px-10 -mt-32 relative pb-10 space-y-8">
                                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-end text-center md:text-left">
                                        <img
                                            src={selectedAnime?.coverImage?.extraLarge || ""}
                                            className="w-48 md:w-56 rounded-3xl shadow-2xl border-8 border-white dark:border-gray-900 transform -rotate-2 hover:rotate-0 transition-transform duration-300"
                                        />
                                        <div className="flex-1 space-y-3 pb-2">
                                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                                {selectedAnime?.status === 'RELEASING' && <Badge intent="success-solid" className="px-3 py-1 text-[10px] uppercase font-black tracking-widest">Yayında</Badge>}
                                                <Badge intent="gray-solid" className="px-3 py-1 text-[10px] uppercase font-black tracking-widest">{selectedAnime?.format}</Badge>
                                                <Badge intent="primary-solid" className="px-3 py-1 text-[10px] uppercase font-black tracking-widest">{selectedAnime?.meanScore}% Score</Badge>
                                            </div>
                                            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white leading-[1.1] tracking-tighter">
                                                {selectedAnime?.title?.english || selectedAnime?.title?.romaji}
                                            </h2>
                                            <p className="text-brand-500 font-bold uppercase tracking-widest text-sm">{selectedAnime?.title?.native}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <div className="md:col-span-2 space-y-8">
                                            <div className="space-y-4">
                                                <h3 className="text-2xl font-black flex items-center gap-3 tracking-tight">
                                                    <div className="w-2 h-8 bg-brand-500 rounded-full" />
                                                    Açıklama
                                                </h3>
                                                <div
                                                    className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg font-medium"
                                                    dangerouslySetInnerHTML={{ __html: selectedAnime?.description || "" }}
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <h3 className="text-2xl font-black flex items-center gap-3 tracking-tight">
                                                    <div className="w-2 h-8 bg-brand-500 rounded-full" />
                                                    Karakterler
                                                </h3>
                                                <ScrollArea className="w-full whitespace-nowrap pb-4">
                                                    <div className="flex gap-5">
                                                        {animeDetails.characters?.edges?.slice(0, 10).map(edge => (
                                                            <div key={edge?.id} className="w-36 flex-shrink-0 space-y-3 group/char">
                                                                <div className="overflow-hidden rounded-2xl shadow-xl">
                                                                    <img src={edge?.node?.image?.large || ""} className="w-36 h-52 object-cover group-hover/char:scale-110 transition-transform duration-500" />
                                                                </div>
                                                                <div className="text-center px-1">
                                                                    <p className="text-xs font-black truncate uppercase tracking-tighter">{edge?.node?.name?.full}</p>
                                                                    <p className="text-[10px] text-brand-500 font-black uppercase tracking-tighter mt-0.5 opacity-80">{edge?.role}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="p-6 bg-gray-50 dark:bg-gray-800/30 rounded-[32px] border border-gray-100 dark:border-gray-800/50 space-y-6">
                                                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground text-center">İstatistikler</h4>
                                                <div className="space-y-4">
                                                    <DetailItem label="İlk Yayın" value={selectedAnime?.startDate ? `${selectedAnime.startDate.day}/${selectedAnime.startDate.month}/${selectedAnime.startDate.year}` : "N/A"} />
                                                    <DetailItem label="Bölüm Sayısı" value={selectedAnime?.episodes || "Devam ediyor"} />
                                                    <DetailItem label="Türler" value={selectedAnime?.genres?.slice(0, 3).join(", ")} />
                                                </div>
                                            </div>

                                            <Button
                                                className="w-full h-16 text-xl font-black rounded-3xl shadow-2xl shadow-brand-500/30 uppercase tracking-widest transition-all hover:-translate-y-1 active:scale-95"
                                                intent="primary"
                                                loading={isSaving}
                                                onClick={handleSave}
                                            >
                                                {isSaving ? 'Kaydediliyor' : 'Veriye Ekle'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </Card>

                    <Card className="h-fit max-h-[900px] flex flex-col border-none shadow-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-800 overflow-hidden rounded-[32px]">
                        <div className="p-8 border-b bg-gray-50/30 dark:bg-gray-800/20">
                            <h3 className="text-2xl font-black flex items-center gap-3 tracking-tight">
                                <div className="w-2 h-8 bg-brand-500 rounded-full" />
                                Bölümler
                            </h3>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-6">
                                {isLoadingEpisodes ? (
                                    <div className="py-24 flex items-center justify-center">
                                        <AiOutlineLoading3Quarters className="animate-spin text-4xl text-brand-500" />
                                    </div>
                                ) : episodeCollection?.episodes ? (
                                    <div className="grid gap-6">
                                        {episodeCollection.episodes.map(ep => (
                                            <div key={ep.episodeNumber} className="group relative flex gap-5 p-3 rounded-3xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700/50">
                                                <div className="relative w-40 h-24 flex-shrink-0 overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5">
                                                    <img src={ep.episodeMetadata?.image || selectedAnime?.bannerImage || selectedAnime?.coverImage?.large || ""} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-brand-500 text-[10px] text-white rounded-lg font-black tracking-widest uppercase">
                                                        EP {ep.episodeNumber}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0 py-2 flex flex-col justify-center">
                                                    <p className="font-black text-sm truncate uppercase tracking-tight group-hover:text-brand-500 transition-colors">
                                                        {ep.episodeTitle || `Episode ${ep.episodeNumber}`}
                                                    </p>
                                                    {ep.episodeMetadata?.airDate && (
                                                        <p className="text-[10px] text-muted-foreground font-black uppercase mt-1 tracking-tighter opacity-70">
                                                            {new Date(ep.episodeMetadata.airDate).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center py-20 font-black uppercase text-xs tracking-widest text-muted-foreground opacity-50">Bölüm bulunamadı</p>
                                )}
                            </div>
                        </ScrollArea>
                    </Card>
                </div>
            )}
        </AppLayoutStack>
    )
}

function DetailItem({ label, value }: { label: string, value: any }) {
    return (
        <div className="text-center space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{label}</p>
            <p className="text-sm font-black text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    )
}
