import { useSearchSupabaseAnimes, convertSupabaseAnimeToAniList } from "@/api/hooks/supabase-anime.hooks"
import { useMediaPreviewModal } from "@/app/(main)/_features/media/_containers/media-preview-modal"
import { SeaImage } from "@/components/shared/sea-image"
import { CommandGroup, CommandItem } from "@/components/ui/command"
import { useDebounce } from "@/hooks/use-debounce"
import { useRouter } from "@/lib/navigation"
import { atom } from "jotai"
import { useAtom } from "jotai/react"
import React from "react"
import { CommandHelperText, CommandItemMedia, CommandItemMediaSkeleton } from "./_components/command-utils"
import { useSeaCommandContext } from "./sea-command"

const selectMediaActionAtom = atom<"anime" | null>(null)
const selectedAnimeAtom = atom<any | null>(null)

export function useSeaCommandSearchSelectMedia() {
    const [selectMediaAction, setSelectMediaAction] = useAtom(selectMediaActionAtom)
    const [selectedAnime, setSelectedAnime] = useAtom(selectedAnimeAtom)

    return {
        searchAndSelectMedia: (type: "anime") => {
            setSelectMediaAction(type)
        },
        selectedAnime,
        onAcknowledgeSelection: () => {
            setSelectMediaAction(null)
            setSelectedAnime(null)
        },
    }
}

export function SeaCommandSearch() {

    const { setPreviewModalMediaId } = useMediaPreviewModal()

    const [selectMediaAction] = useAtom(selectMediaActionAtom)
    const [, setSelectedAnime] = useAtom(selectedAnimeAtom)

    const { input, select, scrollToTop, command: { isCommand, args } } = useSeaCommandContext()

    const router = useRouter()

    const animeSearchInput = isCommand ? args.join(" ") : input
    const type = "anime"

    const debouncedQuery = useDebounce(animeSearchInput, 500)

    const { data: searchData, isLoading, isFetching } = useSearchSupabaseAnimes({
        title: debouncedQuery,
        perPage: 10,
        enabled: debouncedQuery.length > 0
    })

    const media = React.useMemo(() => {
        const results = searchData?.pages?.[0] || []
        return results.map(convertSupabaseAnimeToAniList)
    }, [searchData])

    React.useEffect(() => {
        const cl = scrollToTop()
        return () => cl()
    }, [input, isLoading, isFetching])


    return (
        <>
            {animeSearchInput === "" ? (
                <>
                    <CommandHelperText
                        command="[başlık]"
                        description="Database'imizde anime ara"
                        show={true}
                    />
                </>
            ) : (

                <CommandGroup heading="Arama sonuçları">
                    {(debouncedQuery !== "" && (!media || media.length === 0) && (isLoading || isFetching)) && (
                        <div className="space-y-1">
                            <CommandItemMediaSkeleton />
                            <CommandItemMediaSkeleton />
                            <CommandItemMediaSkeleton />
                        </div>
                    )}
                    {debouncedQuery !== "" && !isLoading && !isFetching && (!media || media.length === 0) && (
                        <div className="py-14 px-6 text-center text-sm sm:px-14">
                            {<div
                                className="h-[10rem] w-[10rem] mx-auto flex-none rounded-[--radius-md] object-cover object-center relative overflow-hidden"
                            >
                                <SeaImage
                                    src="/luffy-01.png"
                                    alt={""}
                                    fill
                                    quality={100}
                                    priority
                                    sizes="10rem"
                                    className="object-contain object-top"
                                />
                            </div>}
                            <h5 className="mt-4 font-semibold text-[--foreground]">Sonuç bulunamadı</h5>
                            <p className="mt-2 text-[--muted]">
                                Database'imizde bu isimle bir içerik bulamadık. Lütfen tekrar deneyin.
                            </p>
                        </div>
                    )}
                    {media?.map(item => (
                        <CommandItem
                            key={item?.id || ""}
                            onSelect={() => {
                                select(() => {
                                    if (selectMediaAction === "anime") {
                                        setSelectedAnime(item)
                                    } else {
                                        router.push(`/entry?id=${item.id}`)
                                    }
                                })
                            }}
                        >
                            <CommandItemMedia media={item} type={type} />
                        </CommandItem>
                    ))}
                </CommandGroup>
            )}
        </>
    )
}
