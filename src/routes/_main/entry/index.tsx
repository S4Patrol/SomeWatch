import { buildSeaQuery } from "@/api/client/requests"
import { API_ENDPOINTS } from "@/api/generated/endpoints"
import { AL_AnimeDetailsById_Media, Anime_Entry } from "@/api/generated/types"
import { getSupabaseAnimeByAnilistId } from "@/api/hooks/supabase-anime.hooks"
import { serverAuthTokenAtom } from "@/app/(main)/_atoms/server-status.atoms"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { z } from "zod"

const searchSchema = z.object({
    id: z.coerce.number().optional(),
    tab: z.string().optional(),
})

export const Route = createFileRoute("/_main/entry/")({
    validateSearch: searchSchema,
    loaderDeps: ({ search }) => ({ id: search.id }),
    loader: async ({ context, deps }) => {
        const { id } = deps
        if (!id) {
            throw redirect({ to: "/" })
        }

        const serverAuthToken = context.store.get(serverAuthTokenAtom)

        // Hibrit yaklaşım: Önce Supabase'e bak
        let supabaseAnime = null
        let hasSupabaseData = false
        try {
            supabaseAnime = await getSupabaseAnimeByAnilistId(id)
            if (supabaseAnime) {
                hasSupabaseData = true
                console.log(`[Hybrid Entry] Found Supabase data for anime ${id}`)
                // Supabase verisini cache'e ekle
                context.queryClient.setQueryData(["supabase-anime", id], supabaseAnime)
            }
        } catch (error) {
            console.warn(`[Hybrid Entry] Supabase fetch failed for anime ${id}:`, error)
        }

        // AniList verilerini yükle (ama başarısız olursa ve Supabase varsa devam et)
        try {
            await Promise.all([
                context.queryClient.ensureQueryData<Anime_Entry>({
                    queryKey: [API_ENDPOINTS.ANIME_ENTRIES.GetAnimeEntry.key, String(id)],
                    queryFn: () => {
                        return buildSeaQuery<Anime_Entry>({
                            endpoint: API_ENDPOINTS.ANIME_ENTRIES.GetAnimeEntry.endpoint.replace("{id}", String(id)),
                            method: API_ENDPOINTS.ANIME_ENTRIES.GetAnimeEntry.methods[0],
                            password: serverAuthToken,
                        }) as Promise<Anime_Entry>
                    },
                    staleTime: 0,
                }),
                context.queryClient.ensureQueryData<AL_AnimeDetailsById_Media>({
                    queryKey: [API_ENDPOINTS.ANILIST.GetAnilistAnimeDetails.key, String(id)],
                    queryFn: () => {
                        return buildSeaQuery<AL_AnimeDetailsById_Media>({
                            endpoint: API_ENDPOINTS.ANILIST.GetAnilistAnimeDetails.endpoint.replace("{id}", String(id)),
                            method: API_ENDPOINTS.ANILIST.GetAnilistAnimeDetails.methods[0],
                            password: serverAuthToken,
                        }) as Promise<AL_AnimeDetailsById_Media>
                    },
                    staleTime: 0,
                }),
            ])
            console.log(`[Hybrid Entry] Successfully loaded AniList data for anime ${id}`)
        } catch (error) {
            console.error(`[Hybrid Entry] AniList fetch failed for anime ${id}:`, error)
            
            // Eğer Supabase'de veri varsa, hata vermeden devam et
            if (hasSupabaseData) {
                console.log(`[Hybrid Entry] Using Supabase-only mode for anime ${id} (AniList unavailable)`)
                // AniList başarısız oldu ama Supabase var, devam edebiliriz
                return
            }
            
            // Supabase de yoksa hatayı fırlat
            throw error
        }
    },
})
