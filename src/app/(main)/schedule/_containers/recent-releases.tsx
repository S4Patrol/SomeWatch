import { useSupabaseDiscoverRecentlyAiredAnime } from "@/app/(main)/discover/_lib/handle-supabase-discover-queries"
import { MediaEntryCard } from "@/app/(main)/_features/media/_components/media-entry-card"
import { MediaEntryCardSkeleton } from "@/app/(main)/_features/media/_components/media-entry-card-skeleton"
import { AppLayoutStack } from "@/components/ui/app-layout"
import { Carousel, CarouselContent, CarouselDotButtons } from "@/components/ui/carousel"
import { formatDistanceToNow } from "date-fns"
import React from "react"

export function RecentReleases() {

    const { data, isLoading } = useSupabaseDiscoverRecentlyAiredAnime()

    const aired = data?.Page?.media?.filter(Boolean)

    if (!aired?.length && !isLoading) return null

    return (
        <AppLayoutStack className="pb-6">
            <h2>Son Çıkanlar</h2>
            <Carousel
                className="w-full max-w-full"
                gap="md"
                opts={{
                    align: "start",
                    dragFree: true,
                }}
                carouselButtonContainerClass="top-[-3.5rem]"
                autoScroll
            >
                <CarouselDotButtons />
                <CarouselContent className="px-6">
                    {!isLoading ? aired?.map(media => {
                        return (
                            <MediaEntryCard
                                key={media.id}
                                media={media}
                                showLibraryBadge
                                containerClassName="basis-[200px] md:basis-[250px] mx-2 mt-8 mb-0"
                                hideReleasingBadge
                                showTrailer
                                type="anime"
                                overlay={<div className="flex flex-col w-fit absolute right-0 items-end">
                                    <div
                                        className="font-semibold text-white bg-gray-950 z-[1] pl-3 pr-[0.2rem] w-full py-1.5 text-center !tracking-wider !bg-opacity-80 rounded-none rounded-bl-lg"
                                    >{media?.format === "MOVIE" ? "Movie" : "Son yayınlanan"}</div>
                                    <div className="text-xs font-semibold z-[-1] w-fit h-fit pl-2 pr-[0.3rem] py-1 ml-2 text-center bg-gray-700 !bg-opacity-70 rounded-none rounded-bl-lg">
                                        {media.startDate?.year ? `${media.startDate.year}` : ""}
                                    </div>
                                </div>}
                            />
                        )
                    }) : [...Array(10).keys()].map((v, idx) => <MediaEntryCardSkeleton key={idx} />)}
                </CarouselContent>
            </Carousel>
        </AppLayoutStack>
    )
}
