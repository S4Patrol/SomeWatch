import { useRefreshAnimeCollection } from "@/api/hooks/anilist.hooks"
import { useLogout } from "@/api/hooks/auth.hooks"
import { useGetExtensionUpdateData as useGetExtensionUpdateData, usePluginWithIssuesCount } from "@/api/hooks/extensions.hooks"
import { isLoginModalOpenAtom } from "@/app/(main)/_atoms/server-status.atoms"
import { useSyncIsActive } from "@/app/(main)/_atoms/sync.atoms"
import { ElectronUpdateModal } from "@/app/(main)/_electron/electron-update-modal"
import { SidebarNavbar } from "@/app/(main)/_features/layout/top-navbar"
import { usePluginSidebarItems } from "@/app/(main)/_features/plugin/webview/plugin-sidebar"
import { useSeaCommand } from "@/app/(main)/_features/sea-command/sea-command"
import { UpdateModal } from "@/app/(main)/_features/update/update-modal"
import { useAutoDownloaderQueueCount } from "@/app/(main)/_hooks/autodownloader-queue-count"
import { useWebsocketMessageListener } from "@/app/(main)/_hooks/handle-websockets"
import { useMissingEpisodeCount } from "@/app/(main)/_hooks/missing-episodes-loader"
import { useCurrentUser, useServerStatus } from "@/app/(main)/_hooks/use-server-status"
import { ConfirmationDialog, useConfirmationDialog } from "@/components/shared/confirmation-dialog"
import { SeaLink } from "@/components/shared/sea-link"
import { AppSidebar, useAppSidebarContext } from "@/components/ui/app-layout"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, IconButton } from "@/components/ui/button"
import { cn } from "@/components/ui/core/styling"
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { defineSchema, Field, Form } from "@/components/ui/form"
import { HoverCard } from "@/components/ui/hover-card"
import { Modal } from "@/components/ui/modal"
import { VerticalMenu, VerticalMenuItem } from "@/components/ui/vertical-menu"
import { openTab } from "@/lib/helpers/browser"
import { useTranslation } from "@/lib/i18n/use-translation"
import { usePathname, useRouter } from "@/lib/navigation"
import { ANILIST_OAUTH_URL, ANILIST_PIN_URL } from "@/lib/server/config"
import { TORRENT_CLIENT, TORRENT_PROVIDER } from "@/lib/server/settings"
import { WSEvents } from "@/lib/server/ws-events"
import { useThemeSettings } from "@/lib/theme/theme-hooks"
import { __isDesktop__, __isElectronDesktop__ } from "@/types/constants"
import { useAtom } from "jotai"
import React from "react"
import { BiChevronRight, BiExtension, BiLogIn, BiLogOut } from "react-icons/bi"
import { FiLogIn, FiSearch } from "react-icons/fi"
import { HiOutlineServerStack } from "react-icons/hi2"
import { IoCloudOfflineOutline, IoHomeOutline } from "react-icons/io5"
import { LuBookOpen, LuCalendar, LuCompass, LuRefreshCw, LuRss, LuSettings } from "react-icons/lu"
import { MdOutlineConnectWithoutContact } from "react-icons/md"
import { PiArrowCircleLeftDuotone, PiArrowCircleRightDuotone } from "react-icons/pi"
import { RiListCheck3 } from "react-icons/ri"
import { SiQbittorrent, SiTransmission } from "react-icons/si"
import { TbReportSearch } from "react-icons/tb"
import { nakamaModalOpenAtom, useNakamaStatus } from "../nakama/nakama-manager"
import { PluginSidebarTray } from "../plugin/tray/plugin-sidebar-tray"
import { isEmailLoginModalOpenAtom, isAccountSettingsModalOpenAtom } from "@/app/(main)/_atoms/server-status.atoms"
import { EmailLoginModal } from "./email-login-modal"
import { AccountSettingsModal } from "./account-settings-modal"
import { LuMail, LuUser, LuShieldCheck, LuUsers } from "react-icons/lu"
import { supabase } from "@/lib/supabase/client"
import { User as SupabaseUser } from "@supabase/supabase-js"
import { toast } from "sonner"

export function MainSidebar() {

    const ctx = useAppSidebarContext()
    const ts = useThemeSettings()

    const [expandedSidebar, setExpandSidebar] = React.useState(false)
    const isCollapsed = ts.expandSidebarOnHover ? (!ctx.isBelowBreakpoint && !expandedSidebar) : !ctx.isBelowBreakpoint

    const containerRef = React.useRef<HTMLDivElement>(null)

    // Logout
    const { mutate: logout } = useLogout()


    const handleExpandSidebar = () => {
        if (!ctx.isBelowBreakpoint && ts.expandSidebarOnHover) {
            setExpandSidebar(true)
        }
    }
    const handleUnexpandedSidebar = () => {
        if (expandedSidebar && ts.expandSidebarOnHover) {
            setExpandSidebar(false)
        }
    }

    return (
        <>
            <AppSidebar
                ref={containerRef}
                className={cn(
                    "group/main-sidebar h-full flex flex-col justify-between transition-gpu w-full transition-[width] duration-300 overflow-x-hidden",
                    // Enable scrolling but hide the scrollbar
                    "overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']",
                    (!ctx.isBelowBreakpoint && expandedSidebar) && "w-[260px]",
                    (!ctx.isBelowBreakpoint && !ts.disableSidebarTransparency) && "bg-transparent",
                    (!ctx.isBelowBreakpoint && !ts.disableSidebarTransparency && ts.expandSidebarOnHover && expandedSidebar) && "bg-[--background] rounded-tr-xl rounded-br-xl border-[--border]",
                )}
                onMouseEnter={handleExpandSidebar}
                onMouseLeave={handleUnexpandedSidebar}
            >
                {(!ctx.isBelowBreakpoint && ts.expandSidebarOnHover && ts.disableSidebarTransparency) && <div
                    className={cn(
                        "fixed h-full translate-x-0 w-[50px] bg-gradient bg-gradient-to-r via-[--background] from-[--background] to-transparent",
                        "group-hover/main-sidebar:translate-x-[250px] transition opacity-0 duration-300 group-hover/main-sidebar:opacity-100",
                    )}
                ></div>}

                <SidebarNavigation
                    isCollapsed={isCollapsed}
                    containerRef={containerRef}
                />

                <div className="flex w-full gap-2 flex-col px-4 shrink-0 pb-2">
                    <SidebarUpdates isCollapsed={isCollapsed} />
                    <SidebarFooter isCollapsed={isCollapsed} onLogout={logout} />
                    <SidebarUser expandedSidebar={expandedSidebar} onLogout={logout} isCollapsed={isCollapsed} />
                </div>
            </AppSidebar>
            <EmailLoginModal />
        </>
    )

}


function SidebarNavigation({ isCollapsed, containerRef }: { isCollapsed: boolean, containerRef: React.RefObject<HTMLDivElement | null> }) {
    const t = useTranslation()
    const ctx = useAppSidebarContext()
    const ts = useThemeSettings()
    const router = useRouter()
    const pathname = usePathname()
    const serverStatus = useServerStatus()

    // Commands
    const { setSeaCommandOpen } = useSeaCommand()

    // Data
    const missingEpisodeCount = useMissingEpisodeCount()
    const autoDownloaderQueueCount = useAutoDownloaderQueueCount()

    // Torrents
    const [activeTorrentCount, setActiveTorrentCount] = React.useState({ downloading: 0, paused: 0, seeding: 0 })
    useWebsocketMessageListener<{ downloading: number, paused: number, seeding: number }>({
        type: WSEvents.ACTIVE_TORRENT_COUNT_UPDATED,
        onMessage: data => {
            setActiveTorrentCount(data)
        },
    })

    // Refresh AniList
    const { mutate: refreshAC, isPending: isRefreshingAC } = useRefreshAnimeCollection()

    // Items
    const items = React.useMemo(() => [
        {
            id: "home",
            iconType: IoHomeOutline,
            name: t.home,
            href: "/",
            isCurrent: pathname === "/",
        },
        {
            id: "schedule",
            iconType: LuCalendar,
            name: t.schedule,
            href: "/schedule",
            isCurrent: pathname === "/schedule",
            addon: missingEpisodeCount > 0 ? <Badge
                className="absolute right-0 top-0" size="sm"
                intent="alert-solid"
            >{missingEpisodeCount}</Badge> : undefined,
        },
        ...serverStatus?.settings?.library?.enableManga ? [{
            id: "manga",
            iconType: LuBookOpen,
            name: t.manga,
            href: "/manga",
            isCurrent: pathname.startsWith("/manga"),
        }] : [],
        {
            id: "lists",
            iconType: RiListCheck3,
            name: t.myLists,
            href: "/lists",
            isCurrent: pathname === "/lists",
        },
        {
            id: "discover",
            iconType: LuCompass,
            name: t.discover,
            href: "/discover",
            isCurrent: pathname === "/discover",
        },
        {
            id: "search",
            iconType: FiSearch,
            name: t.search,
            href: "/search",
            isCurrent: pathname === "/search",
        },

        ...(
            serverStatus?.settings?.library?.torrentProvider !== TORRENT_PROVIDER.NONE
            && serverStatus?.settings?.torrent?.defaultTorrentClient !== TORRENT_CLIENT.NONE)
            ? [{
                id: "torrent-list",
                iconType: serverStatus?.settings?.torrent?.defaultTorrentClient === TORRENT_CLIENT.QBITTORRENT ? SiQbittorrent : SiTransmission,
                name: (activeTorrentCount.seeding === 0 || !serverStatus?.settings?.torrent?.showActiveTorrentCount)
                    ? t.torrentList
                    : `${t.torrentList} (${activeTorrentCount.seeding} ${t.seeding.toLowerCase()})`,
                href: "/torrent-list",
                isCurrent: pathname === "/torrent-list",
                addon: ((activeTorrentCount.downloading + activeTorrentCount.paused) > 0 && serverStatus?.settings?.torrent?.showActiveTorrentCount)
                    ? <Badge
                        className="absolute right-0 top-0 bg-green-500" size="sm"
                        intent="alert-solid"
                    >{activeTorrentCount.downloading + activeTorrentCount.paused}</Badge>
                    : undefined,
            }] : [],
        ...(serverStatus?.debridSettings?.enabled && !!serverStatus?.debridSettings?.provider) ? [{
            id: "debrid",
            iconType: HiOutlineServerStack,
            name: t.debrid,
            href: "/debrid",
            isCurrent: pathname === "/debrid",
        }] : [],
        ...(!!serverStatus?.settings?.library?.libraryPath) ? [{
            id: "scan-summaries",
            iconType: TbReportSearch,
            name: t.scanSummaries,
            href: "/scan-summaries",
            isCurrent: pathname === "/scan-summaries",
        }] : [],
        ...(serverStatus?.settings?.library?.torrentProvider !== TORRENT_PROVIDER.NONE && !!serverStatus?.settings?.library?.libraryPath) ? [{
            id: "auto-downloader",
            iconType: LuRss,
            name: t.autoDownloader,
            href: "/auto-downloader",
            isCurrent: pathname === "/auto-downloader",
            addon: autoDownloaderQueueCount > 0 ? <Badge
                className="absolute right-0 top-0" size="sm"
                intent="alert-solid"
            >{autoDownloaderQueueCount}</Badge> : undefined,
        }] : [],
    ], [
        pathname,
        missingEpisodeCount,
        serverStatus?.settings?.library?.enableManga,
        serverStatus?.settings?.library?.torrentProvider,
        serverStatus?.settings?.torrent?.defaultTorrentClient,
        serverStatus?.settings?.torrent?.showActiveTorrentCount,
        serverStatus?.debridSettings?.enabled,
        serverStatus?.debridSettings?.provider,
        serverStatus?.settings?.library?.libraryPath,
        activeTorrentCount.seeding,
        activeTorrentCount.downloading,
        activeTorrentCount.paused,
        autoDownloaderQueueCount,
        t,
    ])

    // Plugins
    const pluginWebviewItems = usePluginSidebarItems()

    // Overflow logic
    const [autoUnpinnedIds, setAutoUnpinnedIds] = React.useState<string[]>([])
    const overflowCheckTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

    React.useEffect(() => {
        const handleResize = () => setAutoUnpinnedIds([])
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    const allPinnedItems = React.useMemo(() => {
        return items.filter(item => !ts.unpinnedMenuItems?.includes(item.id))
    }, [items, ts.unpinnedMenuItems])

    const displayedPinnedItems = React.useMemo(() => {
        return allPinnedItems.filter(item => !autoUnpinnedIds.includes(item.id))
    }, [allPinnedItems, autoUnpinnedIds])

    const displayedPluginItems = React.useMemo(() => {
        return pluginWebviewItems.filter((item: any) => !autoUnpinnedIds.includes(item.id))
    }, [pluginWebviewItems, autoUnpinnedIds])

    const checkOverflow = React.useCallback(() => {
        if (!containerRef.current) return

        const { scrollHeight, clientHeight } = containerRef.current
        if (scrollHeight > clientHeight + 2) {
            if (displayedPluginItems.length > 0) {
                const lastPlugin = displayedPluginItems[displayedPluginItems.length - 1] as any
                if (lastPlugin?.id) {
                    setAutoUnpinnedIds(prev => {
                        if (prev.includes(lastPlugin.id)) return prev
                        return [...prev, lastPlugin.id]
                    })
                    return
                }
            }

            if (displayedPinnedItems.length > 1) {
                const lastItem = displayedPinnedItems[displayedPinnedItems.length - 1]
                setAutoUnpinnedIds(prev => {
                    if (prev.includes(lastItem.id)) return prev
                    return [...prev, lastItem.id]
                })
            }
        }
    }, [displayedPinnedItems, displayedPluginItems])

    React.useEffect(() => {
        if (!containerRef.current) return

        const observer = new ResizeObserver(() => {
            if (overflowCheckTimeoutRef.current) {
                clearTimeout(overflowCheckTimeoutRef.current)
            }
            overflowCheckTimeoutRef.current = setTimeout(() => {
                checkOverflow()
            }, 16)
        })

        observer.observe(containerRef.current)
        checkOverflow()

        return () => {
            observer.disconnect()
            if (overflowCheckTimeoutRef.current) {
                clearTimeout(overflowCheckTimeoutRef.current)
            }
        }
    }, [checkOverflow])

    const unpinnedMenuItems = React.useMemo(() => {
        const manuallyUnpinned = items.filter(item => ts.unpinnedMenuItems?.includes(item.id))
        const forcedUnpinned = items.filter(item => autoUnpinnedIds.includes(item.id))
        const forcedUnpinnedPlugins = pluginWebviewItems.filter(item => autoUnpinnedIds.includes(item.id))

        const allHidden = [...manuallyUnpinned, ...forcedUnpinnedPlugins, ...forcedUnpinned]

        if (allHidden.length === 0) return []

        return [
            {
                iconType: BiChevronRight,
                name: t.more,
                subContent: <VerticalMenu
                    items={allHidden}
                    isSidebar
                />,
            } as VerticalMenuItem,
        ]
    }, [items, ts.unpinnedMenuItems, autoUnpinnedIds, pluginWebviewItems, t])

    return (
        <div>
            <div
                className={cn(
                    "mb-4 p-4 pb-0 flex justify-center w-full items-center",
                    __isDesktop__ && "mt-2",
                )}
            >
                <h1 className={cn("text-2xl font-bold tracking-tight text-[--brand] transition-all duration-300", isCollapsed && "hidden")}>
                    SomeWatch
                </h1>
                <h1 className={cn("text-2xl font-bold tracking-tight text-[--brand] transition-all duration-300", !isCollapsed && "hidden")}>
                    SW
                </h1>
            </div>

            <VerticalMenu
                className="px-4"
                collapsed={isCollapsed}
                itemClass="relative"
                itemChevronClass="hidden"
                itemIconClass="transition-transform group-data-[state=open]/verticalMenu_parentItem:rotate-90"
                items={[
                    ...displayedPinnedItems,
                    ...displayedPluginItems,
                    ...unpinnedMenuItems,
                    {
                        iconType: LuRefreshCw,
                        name: t.refreshAniList,
                        onClick: () => {
                            ctx.setOpen(false)
                            if (isRefreshingAC) return
                            refreshAC()
                        },
                    },
                ]}
                subContentClass={cn((ts.hideTopNavbar || __isDesktop__) && "border-transparent !border-b-0")}
                onLinkItemClick={() => ctx.setOpen(false)}
                isSidebar
            />

            <SidebarNavbar
                isCollapsed={isCollapsed}
                handleExpandSidebar={() => { }}
                handleUnexpandedSidebar={() => { }}
            />
            {__isDesktop__ && <div className="w-full flex justify-center px-4">
                <HoverCard
                    side="right"
                    sideOffset={-8}
                    className="bg-transparent border-none"
                    trigger={<IconButton
                        intent="gray-basic"
                        className="!text-[--muted] hover:!text-[--foreground]"
                        icon={<PiArrowCircleLeftDuotone />}
                        onClick={() => {
                            router.back()
                        }}
                    />}
                >
                    <IconButton
                        icon={<PiArrowCircleRightDuotone />}
                        intent="gray-subtle"
                        className="opacity-50 hover:opacity-100"
                        onClick={() => {
                            router.forward()
                        }}
                    />
                </HoverCard>
            </div>}

            <PluginSidebarTray place="sidebar" />

        </div>
    )
}

function SidebarUpdates({ isCollapsed }: { isCollapsed: boolean }) {
    return (
        !__isDesktop__ ? <UpdateModal collapsed={isCollapsed} /> :
            __isElectronDesktop__ ? <ElectronUpdateModal collapsed={isCollapsed} /> :
                null
    )
}

function SidebarFooter({ isCollapsed, onLogout }: { isCollapsed: boolean, onLogout: () => void }) {
    const t = useTranslation()
    const ctx = useAppSidebarContext()
    const pathname = usePathname()
    const serverStatus = useServerStatus()
    const user = useCurrentUser()

    // Extensions
    const { data: updateData } = useGetExtensionUpdateData()
    const pluginWithIssuesCount = usePluginWithIssuesCount()

    // Sync
    const { syncIsActive } = useSyncIsActive()

    // Nakama
    const [nakamaModalOpen, setNakamaModalOpen] = useAtom(nakamaModalOpenAtom)
    const nakamaStatus = useNakamaStatus()

    // Sign out
    const confirmSignOut = useConfirmationDialog({
        title: t.signOut,
        description: "Çıkış yapmak istediğinizden emin misiniz?",
        onConfirm: () => {
            onLogout()
        },
    })
    // Login
    const [loginModal, setLoginModal] = useAtom(isLoginModalOpenAtom)


    return (
        <div>
            <VerticalMenu
                collapsed={isCollapsed}
                itemClass="relative"
                onMouseEnter={() => { }}
                onMouseLeave={() => { }}
                onLinkItemClick={() => ctx.setOpen(false)}
                isSidebar
                items={[
                    ...serverStatus?.settings?.nakama?.enabled ? [{
                        iconType: MdOutlineConnectWithoutContact,
                        iconClass: "size-6",
                        name: t.nakama,
                        isCurrent: nakamaModalOpen,
                        onClick: () => {
                            ctx.setOpen(false)
                            setNakamaModalOpen(true)
                        },
                        addon: <>
                            {nakamaStatus?.isHost && !!nakamaStatus?.connectedPeers?.length && <Badge
                                className="absolute right-0 top-0" size="sm"
                                intent="info"
                            >{nakamaStatus?.connectedPeers?.length}</Badge>}

                            {nakamaStatus?.isConnectedToHost && <div
                                className="absolute right-2 top-2 animate-pulse size-2 bg-green-500 rounded-full"
                            ></div>}
                        </>,
                    }] : [],
                    {
                        iconType: BiExtension,
                        name: t.extensions,
                        href: "/extensions",
                        isCurrent: pathname.includes("/extensions"),
                        addon: (!!updateData?.length || !!pluginWithIssuesCount)
                            ? <Badge
                                className="absolute right-0 top-0 bg-red-500 animate-pulse" size="sm"
                                intent="alert-solid"
                            >
                                {updateData?.length || pluginWithIssuesCount || 1}
                            </Badge>
                            : undefined,
                    },
                    {
                        iconType: IoCloudOfflineOutline,
                        name: t.offline,
                        href: "/sync",
                        isCurrent: pathname.includes("/sync"),
                        addon: (syncIsActive)
                            ? <Badge
                                className="absolute right-0 top-0 bg-blue-500" size="sm"
                                intent="alert-solid"
                            >
                                1
                            </Badge>
                            : undefined,
                    },
                    {
                        iconType: LuSettings,
                        name: t.settings,
                        href: "/settings",
                        isCurrent: pathname === ("/settings"),
                    },
                    ...(ctx.isBelowBreakpoint ? [
                        {
                            iconType: user?.isSimulated ? FiLogIn : BiLogOut,
                            name: user?.isSimulated ? t.signIn : t.signOut,
                            onClick: user?.isSimulated ? () => setLoginModal(true) : confirmSignOut.open,
                        },
                    ] : []),
                ]}
            />
            <ConfirmationDialog {...confirmSignOut} />
        </div>
    )
}

function SidebarUser({ isCollapsed, expandedSidebar, onLogout }: { isCollapsed: boolean, expandedSidebar: boolean, onLogout: () => void }) {
    const t = useTranslation()
    const ctx = useAppSidebarContext()
    const user = useCurrentUser()
    const router = useRouter()

    const [dropdownOpen, setDropdownOpen] = React.useState(false)
    const [loginModal, setLoginModal] = useAtom(isLoginModalOpenAtom)
    const [emailLoginModalOpen, setEmailLoginModalOpen] = useAtom(isEmailLoginModalOpenAtom)
    const [accountSettingsModalOpen, setAccountSettingsModalOpen] = useAtom(isAccountSettingsModalOpenAtom)
    const [loggingIn, setLoggingIn] = React.useState(false)

    // Supabase auth state
    const [supabaseUser, setSupabaseUser] = React.useState<SupabaseUser | null>(null)

    React.useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSupabaseUser(session?.user ?? null)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSupabaseUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleSupabaseLogout = async () => {
        await supabase.auth.signOut()
    }

    // Sign out
    const confirmSignOut = useConfirmationDialog({
        title: t.signOut,
        description: "Çıkış yapmak istediğinizden emin misiniz?",
        onConfirm: () => {
            onLogout()
        },
    })

    return (
        <>
            {!user && <div className="flex w-full gap-2 flex-col">
                <DropdownMenu
                    trigger={<div
                        className={cn(
                            "w-full flex p-2 pt-1 items-center space-x-3",
                            { "hidden": ctx.isBelowBreakpoint },
                        )}
                    >
                        <Avatar size="sm" className="cursor-pointer" src={undefined} />
                        {expandedSidebar && <p className="truncate text-sm text-[--muted]">
                            {supabaseUser ? (supabaseUser.user_metadata?.username || supabaseUser.email) : "Misafir"}
                        </p>}
                    </div>}
                    open={dropdownOpen}
                    onOpenChange={setDropdownOpen}
                >
                    {supabaseUser ? (
                        <>
                            <DropdownMenuItem onClick={() => {}}>
                                <LuUser /> Profil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAccountSettingsModalOpen(true)}>
                                <LuSettings /> Hesap Ayarları
                            </DropdownMenuItem>
                            {supabaseUser?.user_metadata?.role?.toLowerCase() === "admin" && (
                                <DropdownMenuItem onClick={() => toast.info("Admin paneli çok yakında aktif olacak.")}>
                                    <LuShieldCheck /> Admin Paneli
                                </DropdownMenuItem>
                            )}
                            {(supabaseUser?.user_metadata?.role?.toLowerCase() === "admin" || supabaseUser?.user_metadata?.role?.toLowerCase() === "fansub") && (
                                <DropdownMenuItem onClick={() => router.push("/fansub-paneli")}>
                                    <LuUsers /> Fansub Paneli
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={handleSupabaseLogout}>
                                <BiLogOut /> Çıkış yap
                            </DropdownMenuItem>
                        </>
                    ) : (
                        <>
                            <DropdownMenuItem onClick={() => setEmailLoginModalOpen(true)}>
                                <LuMail /> Email ile giriş yap
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLoginModal(true)}>
                                <FiLogIn /> AniList ile giriş yap
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenu>
            </div>}
            {!!user && <div className="flex w-full gap-2 flex-col">
                <DropdownMenu
                    trigger={<div
                        className={cn(
                            "w-full flex p-2 pt-1 items-center space-x-3",
                            { "hidden": ctx.isBelowBreakpoint },
                        )}
                    >
                        <Avatar size="sm" className="cursor-pointer" src={user?.viewer?.avatar?.medium || undefined} />
                        {expandedSidebar && <p className="truncate text-sm text-[--muted]">{user?.viewer?.name}</p>}
                    </div>}
                    open={dropdownOpen}
                    onOpenChange={setDropdownOpen}
                >
                    {!user.isSimulated ? <DropdownMenuItem onClick={confirmSignOut.open}>
                        <BiLogOut /> {t.signOut}
                    </DropdownMenuItem> : <>
                        {supabaseUser ? (
                            <>
                                <DropdownMenuItem onClick={() => {}}>
                                    <LuUser /> Profil
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setAccountSettingsModalOpen(true)}>
                                    <LuSettings /> Hesap Ayarları
                                </DropdownMenuItem>
                                {supabaseUser?.user_metadata?.role?.toLowerCase() === "admin" && (
                                    <DropdownMenuItem onClick={() => toast.info("Admin paneli çok yakında aktif olacak.")}>
                                        <LuShieldCheck /> Admin Paneli
                                    </DropdownMenuItem>
                                )}
                                {(supabaseUser?.user_metadata?.role?.toLowerCase() === "admin" || supabaseUser?.user_metadata?.role?.toLowerCase() === "fansub") && (
                                    <DropdownMenuItem onClick={() => router.push("/fansub-paneli")}>
                                        <LuUsers /> Fansub Paneli
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={handleSupabaseLogout}>
                                    <BiLogOut /> Çıkış yap
                                </DropdownMenuItem>
                            </>
                        ) : (
                            <>
                                <DropdownMenuItem onClick={() => setEmailLoginModalOpen(true)}>
                                    <LuMail /> Email ile giriş yap
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLoginModal(true)}>
                                    <BiLogIn /> AniList ile giriş yap
                                </DropdownMenuItem>
                            </>
                        )}
                    </>}
                </DropdownMenu>
            </div>}

            <Modal
                title="AniList ile giriş yap"
                description="AniList hesabı kullanmanız önerilir."
                open={loginModal && user?.isSimulated}
                onOpenChange={(v) => setLoginModal(v)}
                overlayClass="bg-opacity-95 bg-gray-950"
                contentClass="border"
            >
                <div className="mt-5 text-center space-y-4">

                    <SeaLink
                        href={ANILIST_PIN_URL}
                        target="_blank"
                    >
                        <Button
                            leftIcon={<svg
                                xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="24" height="24"
                                viewBox="0 0 24 24" role="img"
                            >
                                <path
                                    d="M6.361 2.943 0 21.056h4.942l1.077-3.133H11.4l1.052 3.133H22.9c.71 0 1.1-.392 1.1-1.101V17.53c0-.71-.39-1.101-1.1-1.101h-6.483V4.045c0-.71-.392-1.102-1.101-1.102h-2.422c-.71 0-1.101.392-1.101 1.102v1.064l-.758-2.166zm2.324 5.948 1.688 5.018H7.144z"
                                />
                            </svg>}
                            intent="white"
                            size="md"
                        >AniList token'ı al</Button>
                    </SeaLink>

                    <Button intent="white-outline" onClick={() => openTab(ANILIST_OAUTH_URL)}>
                        Anilist.co'dan kod al
                    </Button>
                    <p>ya da</p>
                    <Form
                        schema={defineSchema(({ z }) => z.object({
                            token: z.string().min(1, "Token gerekli"),
                        }))}
                        onSubmit={data => {
                            setLoggingIn(true)
                            router.push("/auth/callback#access_token=" + data.token.trim())
                            setLoginModal(false)
                            setLoggingIn(false)
                        }}
                    >
                        <Field.Textarea
                            name="token"
                            label="Token'ı girin"
                            fieldClass="px-4"
                        />
                        <Field.Submit showLoadingOverlayOnSuccess loading={loggingIn}>Devam Et</Field.Submit>
                    </Form>
                </div>
            </Modal>

            <EmailLoginModal />
            <AccountSettingsModal supabaseUser={supabaseUser} />
            <ConfirmationDialog {...confirmSignOut} />
        </>
    )
}
