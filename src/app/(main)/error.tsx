import { LuffyError } from "@/components/shared/luffy-error"
import { Button } from "@/components/ui/button"
import React from "react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    React.useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex justify-center">
            <LuffyError
                title="İstemci tarafı hatası"
            >
                <p className="max-w-xl text-sm text-[--muted] mb-4">
                    {error.message || "Beklenmeyen bir hata oluştu."}
                </p>
                <Button
                    onClick={
                        () => reset()
                    }
                >
                    Tekrar dene
                </Button>
            </LuffyError>
        </div>
    )
}
