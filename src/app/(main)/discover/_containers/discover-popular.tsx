import { MediaEntryCard } from "@/app/(main)/_features/media/_components/media-entry-card"
import { MediaEntryCardSkeleton } from "@/app/(main)/_features/media/_components/media-entry-card-skeleton"
import { MediaGenreSelector } from "@/app/(main)/_features/media/_components/media-genre-selector"
import {
    __discover_supabase_currentSeasonGenresAtom,
    __discover_supabase_pastSeasonGenresAtom,
    useSupabaseDiscoverCurrentSeasonAnime,
    useSupabaseDiscoverPastSeasonAnime,
} from "@/app/(main)/discover/_lib/handle-supabase-discover-queries"
import { ADVANCED_SEARCH_MEDIA_GENRES } from "@/app/(main)/search/_lib/advanced-search-constants"
import { Carousel, CarouselContent, CarouselDotButtons } from "@/components/ui/carousel"
import { useAtom } from "jotai/react"
import React from "react"

export function DiscoverThisSeason() {

    const { data, isLoading } = useSupabaseDiscoverCurrentSeasonAnime()
    const [selectedGenre, setSelectedGenre] = useAtom(__discover_supabase_currentSeasonGenresAtom)

    return (
        <Carousel
            className="w-full max-w-full"
            gap="xl"
            opts={{
                align: "start",
                dragFree: true,
            }}
            autoScroll
        >
            <MediaGenreSelector
                items={[
                    {
                        name: "All",
                        isCurrent: selectedGenre.length === 0,
                        onClick: () => setSelectedGenre([]),
                    },
                    ...ADVANCED_SEARCH_MEDIA_GENRES.map(genre => ({
                        name: genre,
                        isCurrent: selectedGenre.includes(genre),
                        onClick: () => setSelectedGenre([genre]),
                    })),
                ]}
            />
            {/*<CarouselMasks />*/}
            <CarouselDotButtons />
            <CarouselContent className="px-6">
                {!isLoading && data ? data?.Page?.media?.filter(Boolean)?.sort((a, b) => b.meanScore! - a.meanScore!).map(media => {
                    return (
                        <MediaEntryCard
                            key={media.id}
                            media={media}
                            showLibraryBadge
                            containerClassName="basis-[200px] md:basis-[250px] mx-2 mt-8 mb-0"
                            showTrailer
                            type="anime"
                        />
                    )
                }) : [...Array(10).keys()].map((v, idx) => <MediaEntryCardSkeleton key={idx} />)}
            </CarouselContent>
        </Carousel>
    )
}

export function DiscoverPastSeason() {

    const { data, isLoading } = useSupabaseDiscoverPastSeasonAnime()
    const [selectedGenre, setSelectedGenre] = useAtom(__discover_supabase_pastSeasonGenresAtom)

    return (
        <Carousel
            className="w-full max-w-full"
            gap="xl"
            opts={{
                align: "start",
                dragFree: true,
            }}
            autoScroll
        >
            <MediaGenreSelector
                items={[
                    {
                        name: "All",
                        isCurrent: selectedGenre.length === 0,
                        onClick: () => setSelectedGenre([]),
                    },
                    ...ADVANCED_SEARCH_MEDIA_GENRES.map(genre => ({
                        name: genre,
                        isCurrent: selectedGenre.includes(genre),
                        onClick: () => setSelectedGenre([genre]),
                    })),
                ]}
            />
            {/*<CarouselMasks />*/}
            <CarouselDotButtons />
            <CarouselContent className="px-6">
                {!isLoading && data ? data?.Page?.media?.filter(Boolean)?.sort((a, b) => b.meanScore! - a.meanScore!).map(media => {
                    return (
                        <MediaEntryCard
                            key={media.id}
                            media={media}
                            showLibraryBadge
                            containerClassName="basis-[200px] md:basis-[250px] mx-2 mt-8 mb-0"
                            showTrailer
                            type="anime"
                        />
                    )
                }) : [...Array(10).keys()].map((v, idx) => <MediaEntryCardSkeleton key={idx} />)}
            </CarouselContent>
        </Carousel>
    )
}
