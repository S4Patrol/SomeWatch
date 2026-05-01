import { HIDE_IMAGES } from "@/types/constants"
import React, { forwardRef, useEffect, useState } from "react"

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean
    priority?: boolean
    overrideSrc?: string
    quality?: number | string
    placeholder?: string
    blurDataURL?: string
    sizes?: string
    allowGif?: boolean
}

export const SeaImage = forwardRef<HTMLImageElement, ImageProps & { isExternal?: boolean }>(
    ({ isExternal, fill, priority, quality, placeholder, sizes, allowGif, ...props }, ref) => {
        const [hasError, setHasError] = useState(false)

        useEffect(() => {
            setHasError(false)
        }, [props.src])

        if (HIDE_IMAGES) {
            return <Image
                ref={ref}
                {...props}
                src="/no-cover.png"
                className={props.className}
                alt={props.alt || "cover"}
                fill={fill}
            />
        }

        const effectiveOverride = hasError ? "/no-cover.png" : props.overrideSrc

        function handleError() {
            setHasError(true)
            console.warn(`Error loading image ${props.src}`)
        }

        return <Image
            ref={ref}
            {...props}
            src={props.src || ""}
            alt={props.alt || ""}
            fill={fill}
            priority={priority}
            placeholder={placeholder}
            overrideSrc={effectiveOverride}
            onError={handleError}
        />
    },
)

SeaImage.displayName = "SeaImage"

interface _ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string | any
    alt: string
    width?: number | string
    height?: number | string
    fill?: boolean
    quality?: number | string
    priority?: boolean
    loader?: any
    placeholder?: string
    blurDataURL?: string
    unoptimized?: boolean
    onLoadingComplete?: (img: HTMLImageElement) => void
    layout?: string
    objectFit?: string
    overrideSrc?: string
}

const Image = forwardRef<HTMLImageElement, _ImageProps>((
    {
        src,
        alt,
        width,
        height,
        fill,
        style,
        className,
        quality,
        priority,
        loader,
        placeholder,
        blurDataURL,
        unoptimized,
        onLoadingComplete,
        layout,
        objectFit,
        overrideSrc,
        onLoad,
        ...props
    },
    ref,
) => {
    const [isLoaded, setIsLoaded] = useState(false)
    const [isInView, setIsInView] = useState(priority || false)
    const imgRef = React.useRef<HTMLImageElement>(null)

    const isStaticImport = typeof src === "object" && src !== null && "src" in src
    const imageSrc = overrideSrc || (isStaticImport ? src.src : src)

    const staticBlur = isStaticImport ? src.blurDataURL : undefined

    // Intersection Observer for better lazy loading
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
                rootMargin: "100px", // Start loading 100px before entering viewport
                threshold: 0.01,
            },
        )

        observer.observe(imgRef.current)

        return () => observer.disconnect()
    }, [priority])

    useEffect(() => {
        setIsLoaded(false)
        setIsInView(priority || false)
    }, [imageSrc, priority])

    const blurUrl = (placeholder && placeholder !== "blur" && placeholder !== "empty")
        ? placeholder
        : (placeholder === "blur" ? (blurDataURL || staticBlur) : undefined)

    const fillStyle: React.CSSProperties = fill ? {
        position: "absolute",
        height: "100%",
        width: "100%",
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        color: "transparent",
    } : {}

    const placeholderStyle: React.CSSProperties = (blurUrl && !isLoaded) ? {
        backgroundImage: `url("${blurUrl}")`,
        backgroundSize: objectFit === "contain" ? "contain" : "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        filter: "blur(10px)",
        transform: "scale(1.1)",
    } : {}

    const imageWidth = fill ? undefined : (width || (isStaticImport ? src.width : undefined))
    const imageHeight = fill ? undefined : (height || (isStaticImport ? src.height : undefined))

    // Combine refs
    const combinedRef = React.useCallback((node: HTMLImageElement | null) => {
        imgRef.current = node
        if (typeof ref === "function") {
            ref(node)
        } else if (ref) {
            ref.current = node
        }
    }, [ref])

    return (
        <img
            ref={combinedRef}
            src={isInView ? imageSrc : undefined}
            alt={alt}
            width={imageWidth}
            height={imageHeight}
            decoding="async"
            loading={priority ? "eager" : "lazy"}
            className={className}
            style={{
                ...fillStyle,
                ...placeholderStyle,
                ...(objectFit ? { objectFit: objectFit as any } : {}),
                opacity: isLoaded ? 1 : (blurUrl ? 1 : 0),
                transition: "opacity 0.3s ease-in-out",
                ...style,
            }}
            onLoad={(e) => {
                setIsLoaded(true)
                onLoad?.(e)
                onLoadingComplete?.(e.currentTarget)
            }}
            {...props}
        />
    )
})

Image.displayName = "Image"
