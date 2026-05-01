import Page from "@/app/(main)/fansub-paneli/page"
import { createLazyFileRoute } from "@tanstack/react-router"

export const Route = createLazyFileRoute("/_main/fansub-paneli/")({
    component: Page,
})
