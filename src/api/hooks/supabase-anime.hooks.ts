import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import { AL_BaseAnime } from "@/api/generated/types"

export type SupabaseAnimeSubtitle = {
    url: string
    language: string
    label?: string
}

export type SupabaseAnimeEpisode = {
    number: number
    title: string
    thumbnail?: string
    summary?: string
    airDate?: string
    duration?: string
    videoUrl?: string
    subtitleUrl?: string
    quality?: string
    fileSize?: string
    status?: string
    subtitles?: SupabaseAnimeSubtitle[]
}

export type SupabaseAnime = {
    id: number
    anilist_id: number
    english_name: string | null
    japanese_name: string | null
    romaji_name: string | null
    release_date: string | null
    is_airing: boolean
    status: string | null
    description: string | null
    banner_image: string | null
    cover_image: string | null
    genres: string[] | null
    average_score: number | null
    duration: number | null
    format: string | null
    synonyms: string[] | null
    is_adult: boolean
    country_of_origin: string | null
    is_4k: boolean | null
    created_at: string
    updated_at: string
    // Detaylı veriler
    characters: any[] | null
    episodes: SupabaseAnimeEpisode[] | null
    trailer: any | null
    studios: any[] | null
    staff: any[] | null
    relations: any[] | null
    recommendations: any[] | null
}

/**
 * Fetch anime from Supabase database
 */
export function useGetSupabaseAnimes(options?: { limit?: number, enabled?: boolean }) {
    const { limit = 20, enabled = true } = options || {}

    return useQuery<SupabaseAnime[]>({
        queryKey: ["supabase-animes", limit],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('animes')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(limit)

            if (error) {
                console.error("Supabase anime fetch error:", error)
                throw error
            }

            return data || []
        },
        enabled,
        staleTime: Infinity,
        gcTime: Infinity, // Never garbage collect
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchInterval: false,
        refetchIntervalInBackground: false,
        retry: false, // Don't retry on error
        retryOnMount: false,
        networkMode: 'offlineFirst',
    })
}

/**
 * Fetch single anime details from Supabase by AniList ID
 */
export function useGetSupabaseAnimeByAnilistId(anilistId: number, enabled: boolean = true) {
    return useQuery<SupabaseAnime | null>({
        queryKey: ["supabase-anime", anilistId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('animes')
                .select('*')
                .eq('anilist_id', anilistId)
                .single()

            if (error) {
                // Not found is not an error, just return null
                if (error.code === 'PGRST116') {
                    return null
                }
                console.error("Supabase anime fetch error:", error)
                throw error
            }

            return data
        },
        enabled: enabled && anilistId > 0,
        staleTime: 1000 * 60,
        gcTime: 1000 * 60 * 60,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchInterval: false,
        refetchIntervalInBackground: false,
        retry: false,
        retryOnMount: false,
        networkMode: 'offlineFirst',
    })
}

/**
 * Fetch single anime details from Supabase by AniList ID (non-hook version for loader)
 */
export async function getSupabaseAnimeByAnilistId(anilistId: number): Promise<SupabaseAnime | null> {
    try {
        const { data, error } = await supabase
            .from('animes')
            .select('*')
            .eq('anilist_id', anilistId)
            .single()

        if (error) {
            // Not found is not an error, just return null
            if (error.code === 'PGRST116') {
                return null
            }
            console.error("Supabase anime fetch error:", error)
            return null
        }

        return data
    } catch (error) {
        console.error("Supabase anime fetch error:", error)
        return null
    }
}

/**
 * Search anime in Supabase database with pagination
 */
export function useSearchSupabaseAnimes(searchParams: {
    title?: string | null
    genres?: string[] | null
    status?: string[] | null
    format?: string | null
    season?: string | null
    year?: string | null
    minScore?: number | null
    isAdult?: boolean
    sorting?: string[] | null
    page?: number
    perPage?: number
    enabled?: boolean
}) {
    const { 
        title, genres, status, format, season, year, minScore, isAdult, sorting, 
        page = 1, perPage = 48, enabled = true 
    } = searchParams

    return useInfiniteQuery<SupabaseAnime[]>({
        queryKey: ["supabase-search-animes", searchParams],
        initialPageParam: 1,
        queryFn: async ({ pageParam }) => {
            let query = supabase
                .from('animes')
                .select('*')

            // Title search
            if (title && title.trim()) {
                query = query.or(`english_name.ilike.%${title}%,japanese_name.ilike.%${title}%,romaji_name.ilike.%${title}%`)
            }

            // Genre filter
            if (genres && genres.length > 0) {
                query = query.contains('genres', genres)
            }

            // Status filter
            if (status && status.length > 0) {
                query = query.in('status', status)
            }

            // Format filter
            if (format) {
                query = query.eq('format', format)
            }

            // Year filter
            if (year) {
                query = query.gte('release_date', `${year}-01-01`)
                     .lt('release_date', `${parseInt(year) + 1}-01-01`)
            }

            // Min score filter
            if (minScore !== null && minScore !== undefined) {
                query = query.gte('average_score', minScore)
            }

            // Adult content filter
            query = query.eq('is_adult', isAdult || false)

            // Sorting
            if (sorting && sorting.length > 0) {
                const sort = sorting[0]
                switch (sort) {
                    case 'SCORE_DESC':
                        query = query.order('average_score', { ascending: false })
                        break
                    case 'POPULARITY_DESC':
                        query = query.order('average_score', { ascending: false }) // Use score as popularity proxy
                        break
                    case 'START_DATE_DESC':
                        query = query.order('release_date', { ascending: false })
                        break
                    case 'TITLE_ROMAJI':
                        query = query.order('romaji_name', { ascending: true })
                        break
                    default:
                        query = query.order('updated_at', { ascending: false })
                }
            } else {
                query = query.order('updated_at', { ascending: false })
            }

            // Pagination
            const from = ((pageParam as number) - 1) * perPage
            const to = from + perPage - 1
            query = query.range(from, to)

            const { data, error } = await query

            if (error) {
                console.error("Supabase search error:", error)
                throw error
            }

            return data || []
        },
        getNextPageParam: (lastPage, pages) => {
            // If we got less than perPage items, we've reached the end
            if (lastPage.length < perPage) {
                return undefined
            }
            return pages.length + 1
        },
        enabled,
        staleTime: 1000 * 60,
        gcTime: 1000 * 60 * 60 * 24,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchInterval: false,
        refetchIntervalInBackground: false,
        retry: 0,
        networkMode: 'offlineFirst',
    })
}

/**
 * Get trending anime from Supabase (for discover header)
 */
export function useGetSupabaseTrendingAnimes(options?: { 
    genres?: string[] | null
    limit?: number
    enabled?: boolean 
}) {
    const { genres, limit = 20, enabled = true } = options || {}

    return useQuery<SupabaseAnime[]>({
        queryKey: ["supabase-trending-animes", genres, limit],
        queryFn: async () => {
            let query = supabase
                .from('animes')
                .select('*')

            // Genre filter
            if (genres && genres.length > 0) {
                query = query.contains('genres', genres)
            }

            // Only non-adult content for trending
            query = query.eq('is_adult', false)

            // Order by score and recent updates (trending proxy)
            query = query
                .order('average_score', { ascending: false })
                .order('updated_at', { ascending: false })
                .limit(limit)

            const { data, error } = await query

            if (error) {
                console.error("Supabase trending anime fetch error:", error)
                throw error
            }

            return data || []
        },
        enabled,
        staleTime: 1000 * 60,
        gcTime: 1000 * 60 * 60,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchInterval: false,
        refetchIntervalInBackground: false,
        retry: false,
        retryOnMount: false,
        networkMode: 'offlineFirst',
    })
}

/**
 * Get current season anime from Supabase (for "Sezonun En İyileri")
 */
export function useGetSupabaseCurrentSeasonAnimes(options?: { 
    genres?: string[] | null
    limit?: number
    enabled?: boolean 
}) {
    const { genres, limit = 20, enabled = true } = options || {}

    return useQuery<SupabaseAnime[]>({
        queryKey: ["supabase-current-season-animes", genres, limit],
        queryFn: async () => {
            // Calculate current season
            const currentMonth = new Date().getMonth() + 1
            const currentYear = new Date().getFullYear()
            let season = "SUMMER"
            
            switch (currentMonth) {
                case 1: case 2: case 3:
                    season = "WINTER"
                    break
                case 4: case 5: case 6:
                    season = "SPRING"
                    break
                case 7: case 8: case 9:
                    season = "SUMMER"
                    break
                case 10: case 11: case 12:
                    season = "FALL"
                    break
            }

            let query = supabase
                .from('animes')
                .select('*')

            // Season filter - check release_date year and approximate season
            const seasonStart = getSeasonStartDate(season, currentYear)
            const seasonEnd = getSeasonEndDate(season, currentYear)
            
            query = query
                .gte('release_date', seasonStart)
                .lte('release_date', seasonEnd)

            // Genre filter
            if (genres && genres.length > 0) {
                query = query.contains('genres', genres)
            }

            // Only non-adult content
            query = query.eq('is_adult', false)

            // Order by score (best of season)
            query = query
                .order('average_score', { ascending: false })
                .limit(limit)

            const { data, error } = await query

            if (error) {
                console.error("Supabase current season anime fetch error:", error)
                throw error
            }

            return data || []
        },
        enabled,
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchInterval: false,
        refetchIntervalInBackground: false,
        retry: false,
        retryOnMount: false,
        networkMode: 'offlineFirst',
    })
}

/**
 * Get past season anime from Supabase (for "Geçen Sezonun En İyileri")
 */
export function useGetSupabasePastSeasonAnimes(options?: { 
    genres?: string[] | null
    limit?: number
    enabled?: boolean 
}) {
    const { genres, limit = 20, enabled = true } = options || {}

    return useQuery<SupabaseAnime[]>({
        queryKey: ["supabase-past-season-animes", genres, limit],
        queryFn: async () => {
            // Calculate past season
            const currentMonth = new Date().getMonth() + 1
            const currentYear = new Date().getFullYear()
            let currentSeason = "SUMMER"
            
            switch (currentMonth) {
                case 1: case 2: case 3:
                    currentSeason = "WINTER"
                    break
                case 4: case 5: case 6:
                    currentSeason = "SPRING"
                    break
                case 7: case 8: case 9:
                    currentSeason = "SUMMER"
                    break
                case 10: case 11: case 12:
                    currentSeason = "FALL"
                    break
            }

            // Get previous season
            const pastSeason = currentSeason === "WINTER" ? "FALL" : 
                              currentSeason === "SPRING" ? "WINTER" : 
                              currentSeason === "SUMMER" ? "SPRING" : "SUMMER"
            const pastYear = currentSeason === "WINTER" ? currentYear - 1 : currentYear

            let query = supabase
                .from('animes')
                .select('*')

            // Season filter
            const seasonStart = getSeasonStartDate(pastSeason, pastYear)
            const seasonEnd = getSeasonEndDate(pastSeason, pastYear)
            
            query = query
                .gte('release_date', seasonStart)
                .lte('release_date', seasonEnd)

            // Genre filter
            if (genres && genres.length > 0) {
                query = query.contains('genres', genres)
            }

            // Only non-adult content
            query = query.eq('is_adult', false)

            // Order by score (best of past season)
            query = query
                .order('average_score', { ascending: false })
                .limit(limit)

            const { data, error } = await query

            if (error) {
                console.error("Supabase past season anime fetch error:", error)
                throw error
            }

            return data || []
        },
        enabled,
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchInterval: false,
        refetchIntervalInBackground: false,
        retry: false,
        retryOnMount: false,
        networkMode: 'offlineFirst',
    })
}

/**
 * Get recently aired anime from Supabase (for "Aired Recently")
 */
export function useGetSupabaseRecentlyAiredAnimes(options?: { 
    limit?: number
    enabled?: boolean 
}) {
    const { limit = 20, enabled = true } = options || {}

    return useQuery<SupabaseAnime[]>({
        queryKey: ["supabase-recently-aired-animes", limit],
        queryFn: async () => {
            // Get anime that aired in the last 30 days
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            let query = supabase
                .from('animes')
                .select('*')
                .gte('release_date', thirtyDaysAgo.toISOString().split('T')[0])
                .eq('is_adult', false)
                .order('release_date', { ascending: false })
                .limit(limit)

            const { data, error } = await query

            if (error) {
                console.error("Supabase recently aired anime fetch error:", error)
                throw error
            }

            return data || []
        },
        enabled,
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchInterval: false,
        refetchIntervalInBackground: false,
        retry: false,
        retryOnMount: false,
        networkMode: 'offlineFirst',
    })
}

/**
 * Get trending movies from Supabase (for "Trend filmler")
 */
export function useGetSupabaseTrendingMovies(options?: { 
    limit?: number
    enabled?: boolean 
}) {
    const { limit = 20, enabled = true } = options || {}

    return useQuery<SupabaseAnime[]>({
        queryKey: ["supabase-trending-movies", limit],
        queryFn: async () => {
            let query = supabase
                .from('animes')
                .select('*')
                .eq('format', 'MOVIE')
                .eq('is_adult', false)
                .in('status', ['RELEASING', 'FINISHED'])
                .order('average_score', { ascending: false })
                .order('updated_at', { ascending: false })
                .limit(limit)

            const { data, error } = await query

            if (error) {
                console.error("Supabase trending movies fetch error:", error)
                throw error
            }

            return data || []
        },
        enabled,
        staleTime: Infinity,
        gcTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchInterval: false,
        refetchIntervalInBackground: false,
        retry: false,
        retryOnMount: false,
        networkMode: 'offlineFirst',
    })
}

// Helper functions for season date calculations
function getSeasonStartDate(season: string, year: number): string {
    switch (season) {
        case "WINTER":
            return `${year}-01-01`
        case "SPRING":
            return `${year}-04-01`
        case "SUMMER":
            return `${year}-07-01`
        case "FALL":
            return `${year}-10-01`
        default:
            return `${year}-01-01`
    }
}

function getSeasonEndDate(season: string, year: number): string {
    switch (season) {
        case "WINTER":
            return `${year}-03-31`
        case "SPRING":
            return `${year}-06-30`
        case "SUMMER":
            return `${year}-09-30`
        case "FALL":
            return `${year}-12-31`
        default:
            return `${year}-12-31`
    }
}

/**
 * Convert Supabase anime to AniList format for compatibility with MediaEntryCard
 */
export function convertSupabaseAnimeToAniList(supabaseAnime: SupabaseAnime): AL_BaseAnime {
    return {
        id: supabaseAnime.anilist_id,
        idMal: undefined,
        siteUrl: `https://anilist.co/anime/${supabaseAnime.anilist_id}`,
        status: supabaseAnime.status as any,
        season: undefined,
        type: "ANIME",
        format: supabaseAnime.format as any,
        bannerImage: supabaseAnime.banner_image || undefined,
        episodes: undefined,
        synonyms: supabaseAnime.synonyms || [],
        isAdult: supabaseAnime.is_adult,
        countryOfOrigin: supabaseAnime.country_of_origin || undefined,
        trailer: supabaseAnime.trailer ? {
            id: supabaseAnime.trailer.id || undefined,
            site: supabaseAnime.trailer.site || undefined,
        } : undefined,
        title: {
            userPreferred: supabaseAnime.english_name || supabaseAnime.romaji_name || supabaseAnime.japanese_name || "",
            romaji: supabaseAnime.romaji_name || undefined,
            english: supabaseAnime.english_name || undefined,
            native: supabaseAnime.japanese_name || undefined,
        },
        coverImage: {
            extraLarge: supabaseAnime.cover_image || undefined,
            large: supabaseAnime.cover_image || undefined,
            medium: supabaseAnime.cover_image || undefined,
            color: undefined,
        },
        startDate: supabaseAnime.release_date ? {
            year: parseInt(supabaseAnime.release_date.split('-')[0]),
            month: parseInt(supabaseAnime.release_date.split('-')[1]),
            day: parseInt(supabaseAnime.release_date.split('-')[2]),
        } : undefined,
        endDate: undefined,
        description: supabaseAnime.description || undefined,
        duration: supabaseAnime.duration || undefined,
        genres: supabaseAnime.genres || [],
        meanScore: supabaseAnime.average_score || undefined,
        nextAiringEpisode: undefined,
        ...({ is_4k: supabaseAnime.is_4k || false } as any),
    }
}