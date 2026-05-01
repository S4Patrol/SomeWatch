import { useListMangaProviderExtensions } from "@/api/hooks/extensions.hooks"
import { useServerStatus } from "@/app/(main)/_hooks/use-server-status"
import { useStoredMangaProviders } from "@/app/(main)/manga/_lib/handle-manga-selected-provider"
import { SettingsCard, SettingsPageHeader } from "@/app/(main)/settings/_components/settings-card"
import { SettingsSubmitButton } from "@/app/(main)/settings/_components/settings-submit-button"
import { ConfirmationDialog, useConfirmationDialog } from "@/components/shared/confirmation-dialog"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/form"
import { atom } from "jotai"
import { useAtom } from "jotai/react"
import React from "react"
import { useFormContext } from "react-hook-form"
import { LuBookOpen } from "react-icons/lu"
import { toast } from "sonner"

type MangaSettingsProps = {
    isPending: boolean
}

const __manga_storedProvidersHistoryAtom = atom<Record<string, string> | null>(null)

export function MangaSettings(props: MangaSettingsProps) {

    const {
        isPending,
        ...rest
    } = props

    const serverStatus = useServerStatus()
    const f = useFormContext()

    const { data: extensions } = useListMangaProviderExtensions()

    const { storedProviders, overwriteStoredProviders, overwriteStoredProvidersWith } = useStoredMangaProviders(extensions)
    const [storedProvidersHistory, setStoredProvidersHistory] = useAtom(__manga_storedProvidersHistoryAtom)

    const options = React.useMemo(() => {
        return [
            { label: "Otomatik", value: "-" },
            ...(extensions?.map(provider => ({
                label: provider.name,
                value: provider.id,
            })) ?? []).sort((a, b) => a.label.localeCompare(b.label)),
        ]
    }, [extensions])

    const defaultProviderExt = extensions?.find(e => e.id === serverStatus?.settings?.manga?.defaultMangaProvider)

    const confirmDialog = useConfirmationDialog({
        title: "Varsayılan kaynağı zorla",
        description: "Tüm manga kaynaklarını varsayılan kaynakla değiştirecektir. Devam etmek istediğinizden emin misiniz?",
        actionText: "Değiştir",
        actionIntent: "warning",
        onConfirm: async () => {
            if (!defaultProviderExt) return
            const oldProviders = structuredClone(storedProviders)
            overwriteStoredProvidersWith(defaultProviderExt.id)
            toast.success("Tüm kaynak seçimleri değiştirildi.")
            setTimeout(() => {
                setStoredProvidersHistory(oldProviders)
            }, 500)
        },
    })

    return (
        <>
            <SettingsPageHeader
                title="Manga"
                description="İzlemek istediğiniz manga serilerini bulun, indirin ve ilerlemenizi takip edin."
                icon={LuBookOpen}
            />

            <SettingsCard>
                <Field.Switch
                    side="right"
                    name="enableManga"
                    label={<span className="flex gap-1 items-center">Etkinleştir</span>}
                    help="Manga serilerini okuyun, bölümleri indirin ve ilerlemenizi takip edin."
                />
            </SettingsCard>

            <SettingsCard>
                <Field.Select
                    name="defaultMangaProvider"
                    label="Varsayılan Kaynak"
                    help="Yeni bir manga serisi açtığınızda varsayılan olarak seçilecek kaynak."
                    options={options}
                />
                {(!!defaultProviderExt && f.watch("defaultMangaProvider") === serverStatus?.settings?.manga?.defaultMangaProvider) && (
                    <div className="flex w-full space-x-4 flex-wrap">
                        <Button className="px-0 py-1" intent="warning-link" onClick={() => confirmDialog.open()}>
                            {defaultProviderExt.name} ile tüm manga kaynaklarını değiştir
                        </Button>
                        {!!storedProvidersHistory && (
                            <Button
                                className="px-0 py-1" intent="gray-link" onClick={() => {
                                    overwriteStoredProviders(storedProvidersHistory)
                                    toast.success("Previous source selections have been restored.")
                                    setStoredProvidersHistory(null)
                                }}
                            >
                                Undo
                            </Button>
                        )}
                    </div>
                )}
                <Field.Switch
                    side="right"
                    name="mangaAutoUpdateProgress"
                    label="Otomatik İlerleme Güncelleme"
                    help="Etkinleştirilirse, bir bölümü okumayı bitirdiğinizde ilerlemeniz otomatik olarak güncellenir."
                />
            </SettingsCard>

            <SettingsCard title="Yerel Kaynak" description="Manga serilerini yerel dizininizden okuyun.">

                <Field.DirectorySelector
                    name="mangaLocalSourceDirectory"
                    label="Yerel Kaynak Dizini"
                    help="Manga serilerinin saklandığı dizin. Bu yalnızca yerel manga sağlayıcısı tarafından kullanılır."
                />
            </SettingsCard>

            <ConfirmationDialog {...confirmDialog} />

            <SettingsSubmitButton isPending={isPending} />
        </>
    )
}
