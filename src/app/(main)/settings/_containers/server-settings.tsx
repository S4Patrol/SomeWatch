import { useGetAnilistCacheLayerStatus, useToggleAnilistCacheLayerStatus } from "@/api/hooks/anilist.hooks"
import { useLocalSyncSimulatedDataToAnilist } from "@/api/hooks/local.hooks"
import { __seaCommand_shortcuts } from "@/app/(main)/_features/sea-command/sea-command"
import { SettingsCard } from "@/app/(main)/settings/_components/settings-card"
import { SettingsSubmitButton } from "@/app/(main)/settings/_components/settings-submit-button"
import { ConfirmationDialog, useConfirmationDialog } from "@/components/shared/confirmation-dialog"
import { Alert } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/components/ui/core/styling"
import { Field } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { __isElectronDesktop__ } from "@/types/constants"
import { useAtom } from "jotai/react"
import React from "react"
import { useFormContext } from "react-hook-form"
import { FaRedo } from "react-icons/fa"
import { LuCircleAlert, LuCloudUpload } from "react-icons/lu"
import { useServerStatus } from "../../_hooks/use-server-status"

type ServerSettingsProps = {
    isPending: boolean
}

export function ServerSettings(props: ServerSettingsProps) {

    const {
        isPending,
        ...rest
    } = props

    const serverStatus = useServerStatus()

    const [shortcuts, setShortcuts] = useAtom(__seaCommand_shortcuts)
    const f = useFormContext()

    const { mutate: upload, isPending: isUploading } = useLocalSyncSimulatedDataToAnilist()

    const { data: isApiWorking, isLoading: isFetchingApiStatus } = useGetAnilistCacheLayerStatus()
    const { mutate: toggleCacheLayer, isPending: isTogglingCacheLayer } = useToggleAnilistCacheLayerStatus()

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

            {(!isApiWorking && !isFetchingApiStatus) && (
                <Alert
                    intent="warning-basic"
                    description={<div className="space-y-1">
                        <p>AniList API çalışmıyor. Tüm istekler önbellekten karşılanacaktır.</p>
                        <p>Bunu uygulama ayarlarından devre dışı bırakabilirsiniz.</p>
                    </div>}
                    className="fixed top-4 right-4 z-[50] hidden lg:block"
                />
            )}

            <SettingsCard>
                {/*<p className="text-[--muted]">*/}
                {/*    Only applies to desktop and integrated players.*/}
                {/*</p>*/}

                <Field.Switch
                    side="right"
                    name="autoUpdateProgress"
                    label="İlerleme durumunu otomatik güncelle"
                    help="Etkinleştirilirse, bir bölümün %80'ini izlediğinizde ilerleme durumunuz otomatik olarak güncellenir."
                    moreHelp="Yalnızca masaüstü ve entegre oynatıcılar için geçerlidir."
                />
                {/*<Separator />*/}
                <Field.Switch
                    side="right"
                    name="enableWatchContinuity"
                    label="İzleme geçmişini etkinleştir"
                    help="Etkinleştirilirse, SomeWatch izleme ilerlemenizi hatırlar ve kaldığınız yerden devam etmenizi sağlar."
                    moreHelp="Yalnızca masaüstü ve entegre oynatıcılar için geçerlidir."
                />

                <Field.Switch
                    side="right"
                    name="disableAnimeCardTrailers"
                    label="Anime kartlarındaki fragmanları devre dışı bırak"
                    help="Anime kartlarındaki fragmanları devre dışı bırakır."
                />

                <Separator />

                <Field.Switch
                    side="right"
                    name="hideAudienceScore"
                    label="Seyirci puanını gizle"
                    help="Etkinleştirilirse, seyirci puanı görüntülemeye karar verene kadar gizlenir."
                />

                <Field.Switch
                    side="right"
                    name="enableAdultContent"
                    label="Yetişkin içeriğini etkinleştir"
                    help="Etkinleştirilirse, yetişkin içeriği arama sonuçlarından ve kitaplığınızdan gizlenecektir."
                />
                <Field.Switch
                    side="right"
                    name="blurAdultContent"
                    label="Blur adult content"
                    help="If enabled, adult content will be blurred."
                    fieldClass={cn(
                        !f.watch("enableAdultContent") && "opacity-50",
                    )}
                />

            </SettingsCard>

            <SettingsCard
                title="Yerel Veriler"
                description="Yerel veriler, bir AniList hesabı kullanmadığınız zamanlarda kullanılır."
            >
                <div className={cn(serverStatus?.user?.isSimulated && "opacity-50 pointer-events-none")}>
                    <Field.Switch
                        side="right"
                        name="autoSyncToLocalAccount"
                        label="AniList'ten yerel koleksiyonunu otomatik yedekle"
                        help="Etkinleştirilirse, yerel koleksiyonunuz AniList verileriniz kullanılarak periyodik olarak güncellenir."
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
                    Yerel koleksiyonunu AniList'e yükle
                </Button>
            </SettingsCard>

            <ConfirmationDialog {...confirmDialog} />

            <SettingsCard title="Çevrimdışı mod" description="Yalnızca AniList ile kimlik doğrulaması yapıldığında kullanılabilir.">

                <Field.Switch
                    side="right"
                    name="autoSyncOfflineLocalData"
                    label="Çevrimdışı kullanım için meta verileri otomatik olarak indir"
                    help="Etkinleştirilmezse, çevrimdışı mod sayfasında 'Şimdi senkronize et' seçeneğine tıklayarak yerel meta verilerinizi manuel olarak yenilemeniz gerekir."
                    moreHelp="Çevrimdışı değişiklikler yaparsanız ve henüz AniList ile senkronize etmezseniz duraklatılır."
                />

                <Field.Switch
                    side="right"
                    name="autoSaveCurrentMediaOffline"
                    label="Çevrimdışı kullanım için şu anda izlenen/okunan tüm medyanızı kaydedin"
                    help="Etkinleştirilirse, Seanime şu anda izlediğiniz/okuduğunuz tüm medyayı çevrimdışı kullanım için otomatik olarak kaydedecektir."
                />

            </SettingsCard>

            <SettingsCard title="Klavye kısayolları">
                <div className="space-y-4">
                    {[
                        {
                            label: "Komut paletini aç",
                            value: "meta+j",
                            altValue: "q",
                        },
                    ].map(item => {
                        return (
                            <div className="flex gap-2 items-center" key={item.label}>
                                <label className="text-[--gray]">
                                    <span className="font-semibold">{item.label}</span>
                                </label>
                                <div className="flex gap-2 items-center">
                                    <Button
                                        onKeyDownCapture={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()

                                            const specialKeys = ["Control", "Shift", "Meta", "Command", "Alt", "Option"]
                                            if (!specialKeys.includes(e.key)) {
                                                const keyStr = `${e.metaKey ? "meta+" : ""}${e.ctrlKey ? "ctrl+" : ""}${e.altKey
                                                    ? "alt+"
                                                    : ""}${e.shiftKey ? "shift+" : ""}${e.key.toLowerCase()
                                                        .replace("arrow", "")
                                                        .replace("insert", "ins")
                                                        .replace("delete", "del")
                                                        .replace(" ", "space")
                                                        .replace("+", "plus")}`

                                                // Update the first shortcut
                                                setShortcuts(prev => [keyStr, prev[1]])
                                            }
                                        }}
                                        className="focus:ring-2 focus:ring-[--brand] focus:ring-offset-1"
                                        size="sm"
                                        intent="white-subtle"
                                    >
                                        {shortcuts[0]}
                                    </Button>
                                    <span className="text-[--muted]">veya</span>
                                    <Button
                                        onKeyDownCapture={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()

                                            const specialKeys = ["Control", "Shift", "Meta", "Command", "Alt", "Option"]
                                            if (!specialKeys.includes(e.key)) {
                                                const keyStr = `${e.metaKey ? "meta+" : ""}${e.ctrlKey ? "ctrl+" : ""}${e.altKey
                                                    ? "alt+"
                                                    : ""}${e.shiftKey ? "shift+" : ""}${e.key.toLowerCase()
                                                        .replace("arrow", "")
                                                        .replace("insert", "ins")
                                                        .replace("delete", "del")
                                                        .replace(" ", "space")
                                                        .replace("+", "plus")}`

                                                // Update the second shortcut
                                                setShortcuts(prev => [prev[0], keyStr])
                                            }
                                        }}
                                        className="focus:ring-2 focus:ring-[--brand] focus:ring-offset-1"
                                        size="sm"
                                        intent="white-subtle"
                                    >
                                        {shortcuts[1]}
                                    </Button>
                                </div>
                                {(shortcuts[0] !== "meta+j" || shortcuts[1] !== "q") && (
                                    <Button
                                        onClick={() => {
                                            setShortcuts(["meta+j", "q"])
                                        }}
                                        className="rounded-full"
                                        size="sm"
                                        intent="white-basic"
                                        leftIcon={<FaRedo />}
                                    >
                                        Sıfırla
                                    </Button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </SettingsCard>

            <SettingsCard title="App">
                {/*<Separator />*/}
                <Field.Switch
                    side="right"
                    name="openWebURLOnStart"
                    label="Başlangıçta localhost web URL'sini aç"
                />
                <Field.Switch
                    side="right"
                    name="disableNotifications"
                    label="Sistem bildirimlerini devre dışı bırak"
                    moreHelp="SomeWatch, otomatik indiriciyi veya otomatik tarayıcıyı çalıştırdığında sistem tarafından gösterilen bildirimler."
                />
                <Field.Switch
                    side="right"
                    name="disableCacheLayer"
                    label="AniList önbelleğini devre dışı bırak"
                    help="Etkinleştirilirse, SomeWatch AniList'e yapılan tüm istekleri önbelleğe almayı durduracaktır."
                    moreHelp="Varsayılan olarak, AniList'e yapılan tüm istekler önbelleğe alınır. Bu, AniList çevrimdışı olduğunda SomeWatch'un kullanılabilir kalmasını sağlar. Önbellek dizini yapılandırma dosyasında değiştirilebilir."
                />
                {!f.watch("disableCacheLayer") && (
                    <div>
                        <Switch
                            value={!isApiWorking}
                            onValueChange={v => toggleCacheLayer()}
                            disabled={isTogglingCacheLayer}
                            label="Sadece önbelleği kullan"
                            moreHelp="SomeWatch, API istekleri yapmak yerine önbelleğe alınmış verileri kullanacaktır."
                        />
                    </div>
                )}
                <Field.Switch
                    side="right"
                    name="useFallbackMetadataProvider"
                    label="Yedek meta veri sağlayıcısını kullan"
                    help="Etkinleştirilirse, SomeWatch bölüm meta verilerini almak için alternatif bir kaynak kullanacaktır."
                />
                {/*<Separator />*/}
                {/*<Field.Switch*/}
                {/*    side="right"*/}
                {/*    name="disableAutoDownloaderNotifications"*/}
                {/*    label="Disable Auto Downloader system notifications"*/}
                {/*/>*/}
                {/*/!*<Separator />*!/*/}
                {/*<Field.Switch*/}
                {/*    side="right"*/}
                {/*    name="disableAutoScannerNotifications"*/}
                {/*    label="Disable Auto Scanner system notifications"*/}
                {/*/>*/}
                <Separator />
                <Field.Switch
                    side="right"
                    name="disableUpdateCheck"
                    label={__isElectronDesktop__ ? "Do not fetch update notes" : "Do not check for updates"}
                    help={__isElectronDesktop__ ? (<span className="flex gap-2 items-center">
                        <LuCircleAlert className="size-4 text-[--blue]" />
                        <span>If enabled, new releases won't be displayed. Seanime Denshi may still auto-update in the background.</span>
                    </span>) : "If enabled, Seanime will not check for new releases."}
                    moreHelp={__isElectronDesktop__ ? "You cannot disable auto-updates for Seanime Denshi." : undefined}
                />
                <Field.Select
                    label="Güncelleme Kanalı (Deneysel)"
                    name="updateChannel"
                    help={__isElectronDesktop__ ? "SomeWatch Denshi otomatik güncellemeleri için de geçerlidir." : ""}
                    options={[
                        { label: "GitHub (Default)", value: "github" },
                        { label: "SomeWatch", value: "seanime" },
                        { label: "SomeWatch (Canary)", value: "seanime_nightly" },
                    ]}
                />
                {serverStatus?.settings?.library?.updateChannel === "seanime" && (
                    <Alert intent="info" description="Şu anda SomeWatch tarafından barındırılan bir sürüm kanalını kullanıyorsunuz." />
                )}
                {serverStatus?.settings?.library?.updateChannel === "seanime_nightly" && (
                    <Alert
                        intent="warning"
                        description="Bu, geliştirilmekte olan ve test edilmekte olan bir sürüm kanalıdır. Kararsız güncellemeler alabilirsiniz."
                    />
                )}
            </SettingsCard>

            {/*<Accordion*/}
            {/*    type="single"*/}
            {/*    collapsible*/}
            {/*    className="border rounded-[--radius-md]"*/}
            {/*    triggerClass="dark:bg-[--paper]"*/}
            {/*    contentClass="!pt-2 dark:bg-[--paper]"*/}
            {/*>*/}
            {/*    <AccordionItem value="more">*/}
            {/*        <AccordionTrigger className="bg-gray-900 rounded-[--radius-md]">*/}
            {/*            Advanced*/}
            {/*        </AccordionTrigger>*/}
            {/*        <AccordionContent className="pt-6 flex flex-col md:flex-row gap-3">*/}
            {/*            */}
            {/*        </AccordionContent>*/}
            {/*    </AccordionItem>*/}
            {/*</Accordion>*/}


            <SettingsSubmitButton isPending={isPending} />

        </div>
    )
}

const cardCheckboxStyles = {
    itemContainerClass: cn(
        "block border border-[--border] cursor-pointer transition overflow-hidden w-full",
        "bg-gray-50 hover:bg-[--subtle] dark:bg-gray-950 border-dashed",
        "data-[checked=false]:opacity-30",
        "data-[checked=true]:bg-white dark:data-[checked=true]:bg-gray-950",
        "focus:ring-2 ring-brand-100 dark:ring-brand-900 ring-offset-1 ring-offset-[--background] focus-within:ring-2 transition",
        "data-[checked=true]:border data-[checked=true]:ring-offset-0",
    ),
    itemClass: cn(
        "hidden",
    ),
    // itemLabelClass: cn(
    //     "border-transparent border data-[checked=true]:border-brand dark:bg-transparent dark:data-[state=unchecked]:bg-transparent",
    //     "data-[state=unchecked]:bg-transparent data-[state=unchecked]:hover:bg-transparent dark:data-[state=unchecked]:hover:bg-transparent",
    //     "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:ring-offset-transparent",
    // ),
    // itemLabelClass: "font-medium flex flex-col items-center data-[state=checked]:text-[--brand] cursor-pointer",
    stackClass: "flex md:flex-row flex-col space-y-0 gap-4",
}
