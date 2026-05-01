"use client"

import React, { useState, useRef } from "react"
import { Button, IconButton } from "@/components/ui/button"
import { TextInput } from "@/components/ui/text-input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { LuUpload, LuTrash2, LuPlus, LuFile } from "react-icons/lu"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { toast } from "sonner"
import { cn } from "@/components/ui/core/styling"

type SubtitleUploadProps = {
    anilistId: number
    episodeNumber: number
    existingSubtitles: Array<{ url: string; language: string; label?: string }>
    onSubtitlesChange: (subtitles: Array<{ url: string; language: string; label?: string }>) => void
}

const SUPPORTED_LANGUAGES = [
    { value: "Turkish", label: "Türkçe" },
    { value: "English", label: "İngilizce" },
    { value: "Japanese", label: "Japonca" },
    { value: "Spanish", label: "İspanyolca" },
    { value: "French", label: "Fransızca" },
    { value: "German", label: "Almanca" },
    { value: "Italian", label: "İtalyanca" },
    { value: "Portuguese", label: "Portekizce" },
    { value: "Russian", label: "Rusça" },
    { value: "Arabic", label: "Arapça" },
]

const SUPPORTED_FORMATS = [".srt", ".ass", ".vtt"]

export function SubtitleUpload({ anilistId, episodeNumber, existingSubtitles, onSubtitlesChange }: SubtitleUploadProps) {
    const [subtitles, setSubtitles] = useState(existingSubtitles || [])
    const [uploading, setUploading] = useState(false)
    const [selectedLanguage, setSelectedLanguage] = useState("Turkish")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate file format
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
        if (!SUPPORTED_FORMATS.includes(fileExtension)) {
            toast.error("Desteklenmeyen dosya formatı", {
                description: `Sadece ${SUPPORTED_FORMATS.join(", ")} formatları desteklenmektedir.`
            })
            return
        }

        // Validate file size (max 1MB)
        if (file.size > 1024 * 1024) {
            toast.error("Dosya çok büyük", {
                description: "Alt yazı dosyası maksimum 1MB olabilir."
            })
            return
        }

        setUploading(true)

        try {
            // Create file path: subtitles/{anilistId}/{episodeNumber}/{language}{extension}
            const filePath = `${anilistId}/${episodeNumber}/${selectedLanguage}${fileExtension}`

            // Upload to Supabase Storage via backend proxy
            const formData = new FormData()
            formData.append('file', file)
            formData.append('bucket', 'subtitles')
            formData.append('path', filePath)

            console.log('[SUBTITLE UPLOAD] Uploading:', { filePath, bucket: 'subtitles' })

            const response = await fetch('/api/v1/supabase/storage/v1/object/upload', {
                method: 'POST',
                body: formData,
            })

            console.log('[SUBTITLE UPLOAD] Response status:', response.status)

            if (!response.ok) {
                const errorText = await response.text()
                console.error('[SUBTITLE UPLOAD] Error response:', errorText)
                let errorMessage = 'Upload failed'
                try {
                    const errorData = JSON.parse(errorText) as { error?: string }
                    errorMessage = errorData.error || errorMessage
                } catch {
                    errorMessage = errorText || errorMessage
                }
                throw new Error(errorMessage)
            }

            // Construct public URL manually
            const publicUrl = `https://wupcjlwapbewciyjvgod.supabase.co/storage/v1/object/public/subtitles/${filePath}`
            
            console.log('[SUBTITLE UPLOAD] Success! Public URL:', publicUrl)

            // Add to subtitles list
            const languageLabel = SUPPORTED_LANGUAGES.find(l => l.value === selectedLanguage)?.label || selectedLanguage
            const newSubtitle = {
                url: publicUrl,
                language: selectedLanguage,
                label: `${languageLabel} (SomeSub)`
            }

            // Check if subtitle for this language already exists
            const existingIndex = subtitles.findIndex(s => s.language === selectedLanguage)
            let updatedSubtitles: typeof subtitles

            if (existingIndex >= 0) {
                // Replace existing
                updatedSubtitles = [...subtitles]
                updatedSubtitles[existingIndex] = newSubtitle
                toast.success("Alt yazı güncellendi", {
                    description: `${languageLabel} alt yazısı başarıyla güncellendi.`
                })
            } else {
                // Add new
                updatedSubtitles = [...subtitles, newSubtitle]
                toast.success("Alt yazı eklendi", {
                    description: `${languageLabel} alt yazısı başarıyla yüklendi.`
                })
            }

            setSubtitles(updatedSubtitles)
            onSubtitlesChange(updatedSubtitles)

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }

        } catch (error: any) {
            console.error("Subtitle upload error:", error)
            toast.error("Yükleme hatası", {
                description: error.message || "Alt yazı yüklenirken bir hata oluştu."
            })
        } finally {
            setUploading(false)
        }
    }

    const handleDeleteSubtitle = async (index: number) => {
        const subtitle = subtitles[index]
        
        if (!confirm(`${subtitle.language} alt yazısını silmek istediğinizden emin misiniz?`)) {
            return
        }

        try {
            // Extract file path from URL
            const urlParts = subtitle.url.split('/subtitles/')
            if (urlParts.length > 1) {
                const filePath = urlParts[1].split('?')[0] // Remove query params
                
                // Delete from Supabase Storage via backend proxy
                try {
                    await fetch(`/api/v1/supabase/storage/v1/object/subtitles/${filePath}`, {
                        method: 'DELETE',
                    })
                } catch (error) {
                    console.error("Storage delete error:", error)
                    // Continue anyway, as the file might not exist
                }
            }

            // Remove from list
            const updatedSubtitles = subtitles.filter((_, i) => i !== index)
            setSubtitles(updatedSubtitles)
            onSubtitlesChange(updatedSubtitles)

            toast.success("Alt yazı silindi")

        } catch (error: any) {
            console.error("Subtitle delete error:", error)
            toast.error("Silme hatası", {
                description: error.message || "Alt yazı silinirken bir hata oluştu."
            })
        }
    }

    const handleAddManualUrl = () => {
        const url = prompt("Alt yazı URL'sini girin:")
        if (!url) return

        const languageLabel = SUPPORTED_LANGUAGES.find(l => l.value === selectedLanguage)?.label || selectedLanguage
        const newSubtitle = {
            url: url.trim(),
            language: selectedLanguage,
            label: `${languageLabel} (SomeSub)`
        }

        const updatedSubtitles = [...subtitles, newSubtitle]
        setSubtitles(updatedSubtitles)
        onSubtitlesChange(updatedSubtitles)

        toast.success("Alt yazı eklendi")
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Alt Yazılar ({subtitles.length})
                </label>
            </div>

            {/* Upload Section */}
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                <div className="flex gap-3 items-end">
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">
                            Dil Seçin
                        </label>
                        <Select
                            value={selectedLanguage}
                            onValueChange={setSelectedLanguage}
                            options={SUPPORTED_LANGUAGES}
                            className="bg-white/5 border-white/10"
                            disabled={uploading}
                        />
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={SUPPORTED_FORMATS.join(",")}
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={uploading}
                    />
                    <Button
                        intent="primary"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        leftIcon={uploading ? <AiOutlineLoading3Quarters className="animate-spin" /> : <LuUpload />}
                        disabled={uploading}
                    >
                        {uploading ? "Yükleniyor..." : "Dosya Yükle"}
                    </Button>
                    <Button
                        intent="white-outline"
                        size="sm"
                        onClick={handleAddManualUrl}
                        leftIcon={<LuPlus />}
                        disabled={uploading}
                    >
                        URL Ekle
                    </Button>
                </div>

                <div className="text-xs text-gray-500">
                    Desteklenen formatlar: {SUPPORTED_FORMATS.join(", ")} • Maksimum boyut: 1MB
                </div>
            </div>

            {/* Subtitles List */}
            {subtitles.length > 0 && (
                <div className="space-y-2">
                    {subtitles.map((subtitle, index) => (
                        <div
                            key={index}
                            className={cn(
                                "flex items-center justify-between p-3 rounded-lg border transition-colors",
                                "bg-white/5 border-white/10 hover:border-brand-500/50"
                            )}
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="flex-shrink-0">
                                    <LuFile className="text-brand-500 text-xl" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge intent="primary-solid" className="text-[10px] font-black">
                                            {SUPPORTED_LANGUAGES.find(l => l.value === subtitle.language)?.label || subtitle.language}
                                        </Badge>
                                        <Badge intent="gray" className="text-[10px]">
                                            SomeSub
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-gray-400 truncate">
                                        {subtitle.url}
                                    </p>
                                </div>
                            </div>
                            <IconButton
                                intent="alert-subtle"
                                size="sm"
                                icon={<LuTrash2 />}
                                onClick={() => handleDeleteSubtitle(index)}
                            />
                        </div>
                    ))}
                </div>
            )}

            {subtitles.length === 0 && (
                <div className="py-8 text-center">
                    <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-500">
                        <LuFile size={24} />
                    </div>
                    <p className="text-gray-400 text-sm">Henüz alt yazı eklenmedi</p>
                    <p className="text-gray-500 text-xs mt-1">Yukarıdaki butonları kullanarak alt yazı ekleyin</p>
                </div>
            )}
        </div>
    )
}
