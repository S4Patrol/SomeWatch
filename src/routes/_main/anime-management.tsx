import AnimeManagementPage from "@/app/(main)/anime-management/page"
import { createFileRoute } from "@tanstack/react-router"

// @ts-ignore
export const Route = createFileRoute("/_main/anime-management")({
    component: AnimeManagementPage,
})
