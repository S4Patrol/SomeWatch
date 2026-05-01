import { useLocalSyncSimulatedDataToAnilist } from "@/api/hooks/local.hooks"
import { useServerStatus } from "@/app/(main)/_hooks/use-server-status"
import { SettingsCard, SettingsPageHeader } from "@/app/(main)/settings/_components/settings-card"
import { SettingsSubmitButton } from "@/app/(main)/settings/_components/settings-submit-button"
import { ConfirmationDialog, useConfirmationDialog } from "@/components/shared/confirmation-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/components/ui/core/styling"
import { Field } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import React from "react"
import { LuCloudUpload, LuUserCog } from "react-icons/lu"

type Props = {
    isPending: boolean
    children?: React.ReactNode
}

export function LocalSettings(props: Props) {

    const {
        isPending,
        children,
        ...rest
    } = props

    const serverStatus = useServerStatus()

    const { mutate: upload, isPending: isUploading } = useLocalSyncSimulatedDataToAnilist()

    const confirmDialog = useConfirmationDialog({
        title: "AniList'e Yükle",
        description: "Bu işlem, yerel Seanime koleksiyonunuzu AniList hesabınıza yükleyecektir. Devam etmek istediğinizden emin misiniz?",
        actionText: "Yükle",
        actionIntent: "primary",
        onConfirm: async () => {
            upload()
        },
    })

    return (
        <div className="space-y-4">

            <SettingsPageHeader
                title="Yerel Hesap"
                description="Seanime tarafından yönetilen yerel anime ve manga listesi"
                icon={LuUserCog}
            />

            <SettingsCard
                title="AniList"
                description="Yerel SomeWatch koleksiyonunuzu AniList hesabınıza yükleyebilirsiniz."
            >
                <div className={cn(serverStatus?.user?.isSimulated && "opacity-50 pointer-events-none")}>
                    <Field.Switch
                        side="right"
                        name="autoSyncToLocalAccount"
                        label="AniList'ten otomatik senkronize et"
                        help="Yerel koleksiyonunuzu AniList verilerinizi kullanarak periyodik olarak güncelleyin."
                    />
                </div>
                <Separator />
                <Button
                    size="sm"
                    intent="primary-subtle"
                    loading={isUploading}
                    leftIcon={<LuCloudUpload className="size-4" />}
                    onClick={() => {
                        confirmDialog.open()
                    }}
                    disabled={serverStatus?.user?.isSimulated}
                >
                    AniList'e Yükle
                </Button>
            </SettingsCard>

            <SettingsSubmitButton isPending={isPending} />

            <ConfirmationDialog {...confirmDialog} />

        </div>
    )
}
