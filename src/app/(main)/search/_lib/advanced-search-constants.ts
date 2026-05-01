import { AL_MediaFormat } from "@/api/generated/types"

export const ADVANCED_SEARCH_MEDIA_GENRES = [
    "Action",
    "Adventure",
    "Comedy",
    "Drama",
    "Ecchi",
    "Fantasy",
    "Horror",
    "Mahou Shoujo",
    "Mecha",
    "Music",
    "Mystery",
    "Psychological",
    "Romance",
    "Sci-Fi",
    "Slice of Life",
    "Sports",
    "Supernatural",
    "Thriller",
]

export const ADVANCED_SEARCH_SEASONS = [
    "Winter",
    "Spring",
    "Summer",
    "Fall",
]

export const ADVANCED_SEARCH_FORMATS: { value: AL_MediaFormat, label: string }[] = [
    { value: "TV", label: "TV" },
    { value: "MOVIE", label: "Film" },
    { value: "ONA", label: "ONA" },
    { value: "OVA", label: "OVA" },
    { value: "TV_SHORT", label: "Kısa TV" },
    { value: "SPECIAL", label: "Özel" },
]

export const ADVANCED_SEARCH_FORMATS_MANGA: { value: AL_MediaFormat, label: string }[] = [
    { value: "MANGA", label: "Manga" },
    { value: "ONE_SHOT", label: "One Shot" },
]


export const ADVANCED_SEARCH_COUNTRIES_MANGA: { value: string, label: string }[] = [
    { value: "JP", label: "Japonya" },
    { value: "KR", label: "Güney Kore" },
    { value: "CN", label: "Çin" },
    { value: "TW", label: "Tayvan" },
]

export const ADVANCED_SEARCH_STATUS = [
    { value: "FINISHED", label: "Bitti" },
    { value: "RELEASING", label: "Devam ediyor" },
    { value: "NOT_YET_RELEASED", label: "Henüz yayınlanmadı" },
    { value: "HIATUS", label: "Ara verildi" },
    { value: "CANCELLED", label: "İptal edildi" },
]

export const ADVANCED_SEARCH_SORTING = [
    { value: "TRENDING_DESC", label: "Popüler" },
    { value: "START_DATE_DESC", label: "En yeni" },
    { value: "SCORE_DESC", label: "En beğenilen" },
    { value: "POPULARITY_DESC", label: "En çok izlenen" },
    { value: "EPISODES_DESC", label: "En çok bölüm" },
]

export const ADVANCED_SEARCH_SORTING_MANGA = [
    { value: "TRENDING_DESC", label: "Popüler" },
    { value: "START_DATE_DESC", label: "En yeni" },
    { value: "SCORE_DESC", label: "En beğenilen" },
    { value: "POPULARITY_DESC", label: "En çok okunan" },
    { value: "CHAPTERS_DESC", label: "En çok bölüm" },
]

export const ADVANCED_SEARCH_TYPE = [
    { value: "anime", label: "Anime" },
    { value: "manga", label: "Manga" },
]
