import { useLocalSyncSimulatedDataToAnilist } from "@/api/hooks/local.hooks"
import { SettingsPageHeader } from "@/app/(main)/settings/_components/settings-card"
import { SettingsSubmitButton } from "@/app/(main)/settings/_components/settings-submit-button"
import { ConfirmationDialog, useConfirmationDialog } from "@/components/shared/confirmation-dialog"
import React from "react"
import { SiAnilist } from "react-icons/si"

type Props = {
    isPending: boolean
    children?: React.ReactNode
}

export function AnilistSettings(props: Props) {

    const {
        isPending,
        children,
        ...rest
    } = props

    const { mutate: upload, isPending: isUploading } = useLocalSyncSimulatedDataToAnilist()

    const confirmDialog = useConfirmationDialog({
        title: "AniList'e Yükle",
        description: "Bu işlem, yerel SomeWatch koleksiyonunuzu AniList hesabınıza yükleyecektir. Devam etmek istediğinizden emin misiniz?",
        actionText: "Yükle",
        actionIntent: "primary",
        onConfirm: async () => {
            if (isUploading) return
            upload()
        },
    })

    return (
        <div className="space-y-4">

            <SettingsPageHeader
                title="AniList"
                description="AniList hesabınızı yönetin"
                icon={SiAnilist}
            />


            <SettingsSubmitButton isPending={isPending} />

            <ConfirmationDialog {...confirmDialog} />

        </div>
    )
}
