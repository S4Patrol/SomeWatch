import { useSearchSupabaseAnimes, convertSupabaseAnimeToAniList } from "@/api/hooks/supabase-anime.hooks"
import { __advancedSearch_getValue, __advancedSearch_paramsAtom } from "@/app/(main)/search/_lib/advanced-search.atoms"
import { useAtomValue } from "jotai/react"
import React from "react"

export function useSupabaseAdvancedSearch() {
    const params = useAtomValue(__advancedSearch_paramsAtom)

    const { isLoading, data, fetchNextPage, hasNextPage } = useSearchSupabaseAnimes({
        title: params.title,
        genres: __advancedSearch_getValue(params.genre),
        status: __advancedSearch_getValue(params.status),
        format: __advancedSearch_getValue(params.format),
        season: __advancedSearch_getValue(params.season),
        year: __advancedSearch_getValue(params.year),
        minScore: __advancedSearch_getValue(params.minScore),
        isAdult: params.isAdult,
        sorting: __advancedSearch_getValue(params.sorting),
        perPage: 48,
        enabled: params.active && params.type === "anime", // Only support anime for now
    })

    // Convert Supabase data to AniList format for compatibility
    const convertedData = React.useMemo(() => {
        if (!data) return undefined

        return {
            pages: data.pages.map(page => ({
                Page: {
                    media: page.map(supabaseAnime => convertSupabaseAnimeToAniList(supabaseAnime)),
                    pageInfo: {
                        currentPage: 1, // We handle pagination differently
                        hasNextPage: hasNextPage,
                    }
                }
            }))
        }
    }, [data, hasNextPage])

    return {
        isLoading,
        data: convertedData,
        fetchNextPage,
        hasNextPage,
        type: params.type,
    }
}