import { 
    useGetSupabaseTrendingAnimes, 
    useGetSupabaseCurrentSeasonAnimes,
    useGetSupabasePastSeasonAnimes,
    useGetSupabaseRecentlyAiredAnimes,
    useGetSupabaseTrendingMovies,
    convertSupabaseAnimeToAniList 
} from "@/api/hooks/supabase-anime.hooks"
import { atom } from "jotai"
import { useAtomValue } from "jotai/react"
import React from "react"

export const __discover_supabase_trendingGenresAtom = atom<string[]>([])
export const __discover_supabase_currentSeasonGenresAtom = atom<string[]>([])
export const __discover_supabase_pastSeasonGenresAtom = atom<string[]>([])

export function useSupabaseDiscoverTrendingAnime() {
    const genres = useAtomValue(__discover_supabase_trendingGenresAtom)

    const { data, isLoading } = useGetSupabaseTrendingAnimes({
        genres: genres.length > 0 ? genres : null,
        limit: 20,
        enabled: true,
    })

    // Convert Supabase data to AniList format for compatibility
    const convertedData = React.useMemo(() => {
        if (!data) return undefined

        return {
            Page: {
                media: data.map(supabaseAnime => convertSupabaseAnimeToAniList(supabaseAnime)),
                pageInfo: {
                    currentPage: 1,
                    hasNextPage: false,
                }
            }
        }
    }, [data])

    return {
        data: convertedData,
        isLoading,
    }
}

export function useSupabaseDiscoverCurrentSeasonAnime() {
    const genres = useAtomValue(__discover_supabase_currentSeasonGenresAtom)

    const { data, isLoading } = useGetSupabaseCurrentSeasonAnimes({
        genres: genres.length > 0 ? genres : null,
        limit: 20,
        enabled: true,
    })

    // Convert Supabase data to AniList format for compatibility
    const convertedData = React.useMemo(() => {
        if (!data) return undefined

        return {
            Page: {
                media: data.map(supabaseAnime => convertSupabaseAnimeToAniList(supabaseAnime)),
                pageInfo: {
                    currentPage: 1,
                    hasNextPage: false,
                }
            }
        }
    }, [data])

    return {
        data: convertedData,
        isLoading,
    }
}

export function useSupabaseDiscoverPastSeasonAnime() {
    const genres = useAtomValue(__discover_supabase_pastSeasonGenresAtom)

    const { data, isLoading } = useGetSupabasePastSeasonAnimes({
        genres: genres.length > 0 ? genres : null,
        limit: 20,
        enabled: true,
    })

    // Convert Supabase data to AniList format for compatibility
    const convertedData = React.useMemo(() => {
        if (!data) return undefined

        return {
            Page: {
                media: data.map(supabaseAnime => convertSupabaseAnimeToAniList(supabaseAnime)),
                pageInfo: {
                    currentPage: 1,
                    hasNextPage: false,
                }
            }
        }
    }, [data])

    return {
        data: convertedData,
        isLoading,
    }
}

export function useSupabaseDiscoverRecentlyAiredAnime() {
    const { data, isLoading } = useGetSupabaseRecentlyAiredAnimes({
        limit: 20,
        enabled: true,
    })

    // Convert Supabase data to AniList format for compatibility
    const convertedData = React.useMemo(() => {
        if (!data) return undefined

        return {
            Page: {
                media: data.map(supabaseAnime => convertSupabaseAnimeToAniList(supabaseAnime)),
                pageInfo: {
                    currentPage: 1,
                    hasNextPage: false,
                }
            }
        }
    }, [data])

    return {
        data: convertedData,
        isLoading,
    }
}

export function useSupabaseDiscoverTrendingMovies() {
    const { data, isLoading } = useGetSupabaseTrendingMovies({
        limit: 20,
        enabled: true,
    })

    // Convert Supabase data to AniList format for compatibility
    const convertedData = React.useMemo(() => {
        if (!data) return undefined

        return {
            Page: {
                media: data.map(supabaseAnime => convertSupabaseAnimeToAniList(supabaseAnime)),
                pageInfo: {
                    currentPage: 1,
                    hasNextPage: false,
                }
            }
        }
    }, [data])

    return {
        data: convertedData,
        isLoading,
    }
}