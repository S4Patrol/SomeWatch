import React, { useState, useEffect, useRef } from "react"
import { cn } from "@/components/ui/core/styling"

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string
    alt: string
    fallbackSrc?: string | string[]
    className?: string
    blurDataURL?: string
    priority?: boolean
    onLoad?: () => void
    onError?: () => void
}

export const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(
    (
        {
            src,
            alt,
            fallbackSrc,
            className,
            blurDataURL,
            priority = false,
            onLoad,
            onError,
            ...props
        },
        ref,
    ) => {
        const [imageSrc, setImageSrc] = useState<string>(src)
        const [isLoading, setIsLoading] = useState(true)
        const [hasError, setHasError] = useState(false)
        const [isInView, setIsInView] = useState(priority)
        const imgRef = useRef<HTMLImageElement>(null)
        const fallbackIndex = useRef(0)

        // Intersection Observer for lazy loading
        useEffect(() => {
            if (priority || !imgRef.current) return

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            setIsInView(true)
                            observer.disconnect()
                        }
                    })
                },
                {
                    rootMargin: "50px", // Start loading 50px before entering viewport
                },
            )

            observer.observe(imgRef.current)

            return () => observer.disconnect()
        }, [priority])

        // Update src when prop changes
        useEffect(() => {
            setImageSrc(src)
            setHasError(false)
            fallbackIndex.current = 0
        }, [src])

        const handleLoad = () => {
            setIsLoading(false)
            setHasError(false)
            onLoad?.()
        }

        const handleError = () => {
            // Try fallback images
            if (fallbackSrc) {
                const fallbacks = Array.isArray(fallbackSrc) ? fallbackSrc : [fallbackSrc]
                if (fallbackIndex.current < fallbacks.length) {
                    const nextFallback = fallbacks[fallbackIndex.current]
                    if (nextFallback) {
                        setImageSrc(nextFallback)
                        fallbackIndex.current++
                        return
                    }
                }
            }

            setHasError(true)
            setIsLoading(false)
            onError?.()
        }

        return (
            <div
                ref={imgRef}
                className={cn("relative overflow-hidden", className)}
                style={{ backgroundColor: hasError ? "#1a1a1a" : undefined }}
            >
                {/* Blur placeholder */}
                {isLoading && !hasError && (
                    <div
                        className="absolute inset-0 bg-gray-800 animate-pulse"
                        style={{
                            backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            filter: "blur(10px)",
                        }}
                    />
                )}

                {/* Actual image */}
                {isInView && !hasError && (
                    <img
                        ref={ref}
                        src={imageSrc}
                        alt={alt}
                        className={cn(
                            "transition-opacity duration-300",
                            isLoading ? "opacity-0" : "opacity-100",
                            className,
                        )}
                        onLoad={handleLoad}
                        onError={handleError}
                        loading={priority ? "eager" : "lazy"}
                        {...props}
                    />
                )}

                {/* Error state */}
                {hasError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                        <div className="text-center text-gray-500 text-xs">
                            <svg
                                className="w-8 h-8 mx-auto mb-2 opacity-50"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                        </div>
                    </div>
                )}
            </div>
        )
    },
)

OptimizedImage.displayName = "OptimizedImage"
