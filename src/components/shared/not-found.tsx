import { LuffyError } from "@/components/shared/luffy-error"
import { Button } from "@/components/ui/button"
import { Link } from "@tanstack/react-router"
import React from "react"

export function NotFound() {
    return (
        <div className="p-4 flex flex-col items-center justify-center h-full">
            <LuffyError title="Page Not Found">
                <p className="text-[--muted] mb-4">
                    Aradığınız sayfa mevcut değil.
                </p>
                <Link to="/">
                    <Button>Ana sayfaya git</Button>
                </Link>
            </LuffyError>
        </div>
    )
}
