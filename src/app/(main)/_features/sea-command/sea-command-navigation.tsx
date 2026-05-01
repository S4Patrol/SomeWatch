import { useGetAnimeCollection } from "@/api/hooks/anilist.hooks"
import { useGetMangaCollection } from "@/api/hooks/manga.hooks"
import { useLibraryCollection } from "@/app/(main)/_hooks/anime-library-collection-loader.ts"
import { useServerStatus } from "@/app/(main)/_hooks/use-server-status"
import { CommandGroup, CommandItem, CommandShortcut } from "@/components/ui/command"
import { useRouter } from "@/lib/navigation"
import React from "react"
import { BiArrowBack } from "react-icons/bi"
import { CommandHelperText, CommandItemMedia } from "./_components/command-utils"
import { useSeaCommandContext } from "./sea-command"
import { seaCommand_compareMediaTitles } from "./utils"

// only rendered when typing "/anime" or "/library"
export function SeaCommandUserMediaNavigation() {

    const { select, command: { command, args } } = useSeaCommandContext()
    const { data: animeCollection } = useGetAnimeCollection() // should be available instantly
    const animeLibraryCollection = useLibraryCollection()

    const anime = animeCollection?.MediaListCollection?.lists?.flatMap(n => n?.entries)?.filter(Boolean)?.map(n => n.media)?.filter(Boolean) ?? []

    const router = useRouter()

    const query = args.join(" ")
    const filteredAnime = (command === "anime" && query.length > 0) ? anime.filter(n => seaCommand_compareMediaTitles(n.title, query)) : []
    const filteredAnimeLibrary = (command === "library" && query.length > 0) ? animeLibraryCollection?.lists?.flatMap(l => l.entries)
        ?.filter(n => seaCommand_compareMediaTitles(n?.media?.title, query))
        ?.map(n => n?.media)
        ?.filter(Boolean) ?? [] : []

    return (
        <>
            {query.length === 0 && (
                <>
                    <CommandHelperText
                        command="/anime [başlık]"
                        description="Koleksiyonunuzda anime bulun"
                        show={command === "anime"}
                    />
                    <CommandHelperText
                        command="/library [başlık]"
                        description="Anime kütüphanenizde bulun"
                        show={command === "library"}
                    />
                </>
            )}

            {command === "anime" && filteredAnime.length > 0 && (
                <CommandGroup heading="Animelerim">
                    {filteredAnime.map(n => (
                        <CommandItem
                            key={n.id}
                            onSelect={() => {
                                select(() => {
                                    router.push(`/entry?id=${n.id}`)
                                })
                            }}
                        >
                            <CommandItemMedia media={n} type="anime" />
                        </CommandItem>
                    ))}
                </CommandGroup>
            )}

            {command === "library" && filteredAnimeLibrary.length > 0 && (
                <CommandGroup heading="Kütüphane">
                    {filteredAnimeLibrary.map(n => (
                        <CommandItem
                            key={n.id}
                            onSelect={() => {
                                select(() => {
                                    router.push(`/entry?id=${n.id}`)
                                })
                            }}
                        >
                            <CommandItemMedia media={n} type="anime" />
                        </CommandItem>
                    ))}
                </CommandGroup>
            )}
        </>
    )
}

export function SeaCommandNavigation() {

    const serverStatus = useServerStatus()

    const { select, command: { command, args } } = useSeaCommandContext()

    const router = useRouter()

    const pages = [
        {
            name: "Ana Sayfa",
            href: "/",
            flag: "home",
            show: !serverStatus?.isOffline,
        },
        {
            name: "Takvim",
            href: "/schedule",
            flag: "schedule",
            show: !serverStatus?.isOffline,
        },
        {
            name: "Ayarlar",
            href: "/settings",
            flag: "settings",
            show: !serverStatus?.isOffline,
        },
        {
            name: "Keşfet",
            href: "/discover",
            flag: "discover",
            show: !serverStatus?.isOffline,
        },
        {
            name: "Listelerim",
            href: "/lists",
            flag: "lists",
            show: !serverStatus?.isOffline,
        },
        {
            name: "Otomatik İndirici",
            href: "/auto-downloader",
            flag: "auto-downloader",
            show: !serverStatus?.isOffline,
        },
        {
            name: "Torrent listesi",
            href: "/torrent-list",
            flag: "torrent-list",
            show: !serverStatus?.isOffline,
        },
        {
            name: "Tarama özetleri",
            href: "/scan-summaries",
            flag: "scan-summaries",
            show: !serverStatus?.isOffline,
        },
        {
            name: "Eklentiler",
            href: "/extensions",
            flag: "extensions",
            show: !serverStatus?.isOffline,
        },
        {
            name: "Gelişmiş arama",
            href: "/search",
            flag: "search",
            show: !serverStatus?.isOffline,
        },
    ]

    // If no args, show all pages
    // If args, show pages that match the args
    const filteredPages = pages.filter(page => page.flag.startsWith(command))


    // if (!input.startsWith("/")) return null


    return (
        <>
            {command.startsWith("ba") && (
                <CommandGroup heading="Navigasyon">
                    <CommandItem
                        onSelect={() => {
                            select(() => {
                                router.back()
                            })
                        }}
                    >
                        <BiArrowBack className="mr-2 h-4 w-4" />
                        <span>Geri git</span>
                    </CommandItem>
                </CommandGroup>
            )}
            {command.startsWith("fo") && (
                <CommandGroup heading="Navigasyon">
                    <CommandItem
                        onSelect={() => {
                            select(() => {
                                router.forward()
                            })
                        }}
                    >
                        <BiArrowBack className="mr-2 h-4 w-4 rotate-180" />
                        <span>İleri git</span>
                    </CommandItem>
                </CommandGroup>
            )}

            {/*Typing `/library`, `/schedule`, etc. without args*/}
            {filteredPages.length > 0 && args.length === 0 && (
                <CommandGroup heading="Ekranlar">
                    <>
                        {filteredPages.filter(page => page.show).map(page => (
                            <CommandItem
                                key={page.flag}
                                onSelect={() => {
                                    select(() => {
                                        router.push(page.href)
                                    })
                                }}
                            >
                                <span className="text-sm tracking-wide font-bold text-[--muted]">Git:&nbsp;</span>{" "}{page.name}
                                {command === page.flag ? <CommandShortcut>Enter</CommandShortcut> : <CommandShortcut>/{page.flag}</CommandShortcut>}
                            </CommandItem>
                        ))}
                    </>
                </CommandGroup>
            )}
            {(command !== "back" && command !== "forward") && (
                <CommandGroup heading="Navigasyon">
                    {/* {command === "" && ( */}
                    <>
                        <CommandItem
                            onSelect={() => {
                                select(() => {
                                    router.back()
                                })
                            }}
                        >
                            <BiArrowBack className="mr-2 h-4 w-4" />
                            <span>Geri git</span>
                        </CommandItem>
                        <CommandItem
                            onSelect={() => {
                                select(() => {
                                    router.forward()
                                })
                            }}
                        >
                            <BiArrowBack className="mr-2 h-4 w-4 rotate-180" />
                            <span>İleri git</span>
                        </CommandItem>
                    </>
                    {/* )} */}
                </CommandGroup>
            )}
        </>
    )
}
