import { Models_HomeItem, Nullish } from "@/api/generated/types"
import { ADVANCED_SEARCH_COUNTRIES_MANGA, ADVANCED_SEARCH_MEDIA_GENRES } from "@/app/(main)/search/_lib/advanced-search-constants"

export const DEFAULT_HOME_ITEMS: Models_HomeItem[] = [
    {
        id: "anime-continue-watching",
        type: "anime-continue-watching",
        schemaVersion: 1,
    },
    {
        id: "discover-sections",
        type: "discover-sections",
        schemaVersion: 1,
    },
]

export function isAnimeLibraryItemsOnly(items: Nullish<Models_HomeItem[]>) {
    if (!items) return true

    for (const item of items) {
        if (![
            "anime-continue-watching",
            "anime-library",
            "anime-continue-watching-header",
            "local-anime-library",
            "local-anime-library-stats",
            "library-upcoming-episodes",
        ].includes(item.type)) {
            return false
        }
    }
    return true
}

type HomeItemSchema = {
    name: string
    kind: ("row" | "header")[]
    options?: { label: string, name: string, type: string, options?: any[] }[]
    schemaVersion: number
    description?: string
}

const _carouselOptions = [
    {
        label: "İsim",
        type: "text",
        name: "name",
    },
    {
        label: "Sıralama",
        type: "select",
        name: "sorting",
        options: [
            {
                label: "Popüler",
                value: "POPULARITY_DESC",
            },
            {
                label: "Trend",
                value: "TRENDING_DESC",
            },
            {
                label: "Romaji Başlık (A-Z)",
                value: "TITLE_ROMAJI_ASC",
            },
            {
                label: "Romaji Başlık (Z-A)",
                value: "TITLE_ROMAJI_DESC",
            },
            {
                label: "İngilizce Başlık (A-Z)",
                value: "TITLE_ENGLISH_ASC",
            },
            {
                label: "İngilizce Başlık (Z-A)",
                value: "TITLE_ENGLISH_DESC",
            },
            {
                label: "Puan (0-10)",
                value: "SCORE",
            },
            {
                label: "Puan (10-0)",
                value: "SCORE_DESC",
            },
        ],
    },
    {
        label: "Durum",
        type: "multi-select",
        name: "status",
        options: [
            {
                label: "Yayınlanıyor",
                value: "RELEASING",
            },
            {
                label: "Bitti",
                value: "FINISHED",
            },
            {
                label: "Henüz yayınlanmadı",
                value: "NOT_YET_RELEASED",
            },
        ],
    },
    {
        label: "Format",
        type: "select",
        name: "format",
        options: [
            {
                label: "TV",
                value: "TV",
            },
            {
                label: "Movie",
                value: "MOVIE",
            },
            {
                label: "OVA",
                value: "OVA",
            },
            {
                label: "ONA",
                value: "ONA",
            },
            {
                label: "Special",
                value: "SPECIAL",
            },
        ],
    },
    {
        label: "Türler",
        type: "multi-select",
        options: ADVANCED_SEARCH_MEDIA_GENRES.map(n => ({ value: n, label: n })),
        name: "genres",
    },
    {
        label: "Mevsim",
        type: "select",
        name: "season",
        options: [
            { value: "WINTER", label: "Kış" },
            { value: "SPRING", label: "İlkbahar" },
            { value: "SUMMER", label: "Yaz" },
            { value: "FALL", label: "Sonbahar" },
        ],
    },
    {
        label: "Yıl",
        type: "number",
        name: "year",
        min: 0,
        max: 2100,
    },
    {
        label: "Köken Ülke",
        type: "select",
        name: "countryOfOrigin",
        options: ADVANCED_SEARCH_COUNTRIES_MANGA,
    },
]

export const HOME_ITEMS = {
    "centered-title": {
        name: "Ortalanmış Başlık",
        kind: ["row"],
        schemaVersion: 1,
        description: "Ortalanmış bir başlık metni görüntüler.",
        options: [{
            label: "Metin",
            type: "text",
            name: "text",
        }],
    },
    "anime-continue-watching": {
        name: "İzlemeye Devam Et",
        kind: ["row", "header"],
        schemaVersion: 1,
        description: "Şu an izlediğiniz bölümlerin listesini görüntüler.",
    },
    "anime-continue-watching-header": {
        name: "İzlemeye Devam Et (Geniş)",
        kind: ["header"],
        schemaVersion: 1,
        description: "Şu an izlediğiniz animeleri geniş bir kaydırıcıda görüntüler.",
    },

    "my-lists": {
        name: "Listelerim",
        kind: ["row"],
        schemaVersion: 1,
        description: "Listelerinizdeki medyaları duruma göre görüntüler.",
        options: [
            {
                label: "Durumlar",
                name: "statuses",
                type: "multi-select",
                options: [
                    {
                        value: "CURRENT",
                        label: "Şu An İzleniyor",
                    },
                    {
                        value: "PAUSED",
                        label: "Duraklatıldı",
                    },
                    {
                        value: "PLANNING",
                        label: "Planlanıyor",
                    },
                    {
                        value: "COMPLETED",
                        label: "Tamamlandı",
                    },
                    {
                        value: "DROPPED",
                        label: "Bırakıldı",
                    },
                ],
            },
            {
                label: "Düzen",
                name: "layout",
                type: "select",
                options: [
                    {
                        label: "Izgara",
                        value: "grid",
                    },
                    {
                        label: "Kaydırıcı",
                        value: "carousel",
                    },
                ],
            },
            {
                label: "Tür",
                name: "type",
                type: "select",
                options: [
                    {
                        label: "Anime",
                        value: "anime",
                    },
                    {
                        label: "Manga",
                        value: "manga",
                    },
                ],
            },
            {
                label: "Özel liste adı (İsteğe bağlı)",
                type: "text",
                name: "customListName",
            },
        ],
    },
    "local-anime-library": {
        name: "Yerel Anime Kütüphanesi",
        kind: ["row"],
        schemaVersion: 2,
        description: "Yerel kütüphanenizdeki tüm animeleri görüntüler.",
        options: [
            {
                label: "Düzen",
                name: "layout",
                type: "select",
                options: [
                    {
                        label: "Izgara",
                        value: "grid",
                    },
                    {
                        label: "Kaydırıcı",
                        value: "carousel",
                    },
                ],
            },
        ],
    },
    "library-upcoming-episodes": {
        name: "Yaklaşan Kütüphane Bölümleri",
        kind: ["row"],
        schemaVersion: 1,
        description: "Kütüphanenizdeki animelerin yaklaşan bölümlerini görüntüler.",
    },
    "aired-recently": {
        name: "Yeni Yayınlananlar (Global)",
        kind: ["row"],
        schemaVersion: 1,
        description: "Yakın zamanda yayınlanan anime bölümlerini görüntüler.",
    },
    "missed-sequels": {
        name: "Kaçırılan Devam Serileri",
        kind: ["row"],
        schemaVersion: 1,
        description: "Koleksiyonunuzda olmayan devam serilerini görüntüler.",
    },
    "anime-schedule-calendar": {
        name: "Anime Takvimi",
        kind: ["row"],
        schemaVersion: 2,
        description: "Yayın akışına göre anime bölümlerini bir takvimde görüntüler.",
        options: [
            {
                label: "Tür",
                name: "type",
                type: "select",
                options: [
                    {
                        label: "Listelerim",
                        value: "my-lists",
                    },
                    {
                        label: "Global",
                        value: "global",
                    },
                ],
            },
        ],
    },
    "local-anime-library-stats": {
        name: "Yerel Kütüphane İstatistikleri",
        kind: ["row"],
        schemaVersion: 1,
        description: "Yerel anime kütüphaneniz için istatistikleri görüntüler.",
    },
    "discover-header": {
        name: "Keşfet (Geniş)",
        kind: ["header"],
        schemaVersion: 1,
        description: "Trend olan animeleri geniş bir kaydırıcıda görüntüler.",
    },
    "anime-carousel": {
        name: "Anime Kaydırıcı",
        kind: ["row"],
        schemaVersion: 3,
        options: _carouselOptions,
        description: "Seçilen seçeneklere göre animeleri kaydırıcıda görüntüler.",
    },
    "manga-carousel": {
        name: "Manga Kaydırıcı",
        kind: ["row"],
        schemaVersion: 1,
        description: "Seçilen seçeneklere göre mangaları kaydırıcıda görüntüler.",
        options: _carouselOptions.map(n => {
            if (n.name === "format") {
                return {
                    ...n,
                    options: [
                        {
                            label: "Manga",
                            value: "MANGA",
                        },
                        {
                            label: "One Shot",
                            value: "ONE_SHOT",
                        },
                    ],
                }
            }
            return n
        }),
    },
    "manga-library": {
        name: "Manga Kütüphanesi",
        kind: ["row", "header"],
        schemaVersion: 2,
        description: "Kütüphanenizdeki mangaları duruma göre görüntüler.",
        options: [
            {
                label: "Durumlar",
                name: "statuses",
                type: "multi-select",
                options: [
                    {
                        value: "CURRENT",
                        label: "Şu An Okunuyor",
                    },
                    {
                        value: "PAUSED",
                        label: "Duraklatıldı",
                    },
                ],
            },
            {
                label: "Düzen",
                name: "layout",
                type: "select",
                options: [
                    {
                        label: "Izgara",
                        value: "grid",
                    },
                    {
                        label: "Kaydırıcı",
                        value: "carousel",
                    },
                ],
            },
        ],
    },
    "sitemizdekiler": {
        name: "Sitemizdekiler",
        kind: ["row"],
        schemaVersion: 1,
        description: "Veritabanımızdaki animeleri gösterir. Eksik veriler AniList'ten çekilir.",
    },
    "discover-sections": {
        name: "Keşfet",
        kind: ["row"],
        schemaVersion: 1,
        description: "Keşfet sayfasındaki tüm bölümleri (trendler, sezonluk, yaklaşanlar vb.) görüntüler.",
    },
} as Record<string, HomeItemSchema>

export const HOME_ITEM_IDS = Object.keys(HOME_ITEMS) as (keyof typeof HOME_ITEMS)[]

// export type HomeItemID = (keyof typeof HOME_ITEMS)
