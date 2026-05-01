import { useCurrentDevicePlaybackSettings, useExternalPlayerLink } from "@/app/(main)/_atoms/playback.atoms"
import { useServerStatus } from "@/app/(main)/_hooks/use-server-status"
import { SettingsCard, SettingsPageHeader } from "@/app/(main)/settings/_components/settings-card"
import { SettingsSubmitButton } from "@/app/(main)/settings/_components/settings-submit-button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert } from "@/components/ui/alert"
import { Field } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { TextInput } from "@/components/ui/text-input"
import { getDefaultIinaSocket, getDefaultMpvSocket } from "@/lib/server/settings"
import React from "react"
import { useWatch } from "react-hook-form"
import { FcClapperboard, FcVideoCall, FcVlc } from "react-icons/fc"
import { HiPlay } from "react-icons/hi"
import { IoPlayForwardCircleSharp } from "react-icons/io5"
import { LuCircleArrowOutUpRight, LuMonitorPlay } from "react-icons/lu"
import { RiSettings3Fill } from "react-icons/ri"

type MediaplayerSettingsProps = {
    isPending: boolean
}

export function MediaplayerSettings(props: MediaplayerSettingsProps) {

    const {
        isPending,
    } = props

    const serverStatus = useServerStatus()
    const selectedPlayer = useWatch({ name: "defaultPlayer" })

    return (
        <>
            <SettingsPageHeader
                title="Masaüstü Medya Oynatıcı"
                description="SomePlayer; MPV, VLC, IINA ve MPC-HC için yerleşik desteğe sahiptir."
                icon={LuMonitorPlay}
            />

            <SettingsCard>
                <Field.Select
                    name="defaultPlayer"
                    label="Varsayılan oynatıcı"
                    leftIcon={<FcVideoCall />}
                    options={[
                        { label: "MPV", value: "mpv" },
                        { label: "VLC", value: "vlc" },
                        { label: "MPC-HC (Windows)", value: "mpc-hc" },
                        { label: "IINA (macOS)", value: "iina" },
                    ]}
                    help="Dosyaları açmak ve ilerlemenizi otomatik olarak izlemek için kullanılacak oynatıcı."
                />
                {selectedPlayer === "iina" && <Alert
                    intent="info-basic"
                    description={<p>IINA'nın SomeWatch ile düzgün çalışması için genel ayarlarında <strong>Tüm pencereler kapatıldıktan sonra çık</strong> seçeneğinin <span
                        className="underline"
                    >işaretli</span> ve <strong>Oynatma bittikten sonra pencereyi açık tut</strong> seçeneğinin <span className="underline">işaretsiz</span> olduğundan emin olun.</p>}
                />}
            </SettingsCard>

            <SettingsCard title="Oynatma">
                <Field.Switch
                    side="right"
                    name="autoPlayNextEpisode"
                    label="Sonraki bölümü otomatik oynat"
                    help="Etkinleştirilirse SomeWatch, mevcut bölüm tamamlandıktan sonra kısa bir gecikmenin ardından sıradaki bölümü oynatır."
                />
            </SettingsCard>

            <SettingsCard title="Yapılandırma">


                <Field.Text
                    name="mediaPlayerHost"
                    label="Sunucu (Host)"
                    help="VLC/MPC-HC"
                />

                <Accordion
                    type="single"
                    className=""
                    triggerClass="text-[--muted] dark:data-[state=open]:text-white px-0 dark:hover:bg-transparent hover:bg-transparent dark:hover:text-white hover:text-black"
                    itemClass=""
                    contentClass="p-4 border rounded-[--radius-md]"
                    collapsible
                    defaultValue={serverStatus?.settings?.mediaPlayer?.defaultPlayer}
                >
                    <AccordionItem value="vlc">
                        <AccordionTrigger>
                            <h4 className="flex gap-2 items-center"><FcVlc /> VLC</h4>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <Field.Text
                                    name="vlcUsername"
                                    label="Kullanıcı Adı"
                                />
                                <Field.Text
                                    name="vlcPassword"
                                    label="Şifre"
                                    type="password"
                                />
                                <Field.Number
                                    name="vlcPort"
                                    label="Bağlantı Noktası (Port)"
                                    formatOptions={{
                                        useGrouping: false,
                                    }}
                                    hideControls
                                />
                            </div>
                            <Field.Text
                                name="vlcPath"
                                label="Uygulama yolu"
                            />
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="mpc-hc">
                        <AccordionTrigger>
                            <h4 className="flex gap-2 items-center"><FcClapperboard /> MPC-HC</h4>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="flex flex-col md:flex-row gap-4">
                                <Field.Number
                                    name="mpcPort"
                                    label="Bağlantı Noktası (Port)"
                                    formatOptions={{
                                        useGrouping: false,
                                    }}
                                    hideControls
                                />
                                <Field.Text
                                    name="mpcPath"
                                    label="Uygulama yolu"
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="mpv">
                        <AccordionTrigger>
                            <h4 className="flex gap-2 items-center"><HiPlay className="mr-1 text-purple-100" /> MPV</h4>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="flex gap-4">
                                <Field.Text
                                    name="mpvSocket"
                                    label="Soket"
                                    placeholder={`Varsayılan: '${getDefaultMpvSocket(serverStatus?.os ?? "")}'`}
                                />
                                <Field.Text
                                    name="mpvPath"
                                    label="Uygulama yolu"
                                    placeholder={serverStatus?.os === "windows" ? "örn. C:/Program Files/mpv/mpv.exe" : serverStatus?.os === "darwin"
                                        ? "örn. /Applications/mpv.app/Contents/MacOS/mpv"
                                        : "Varsayılan CLI"}
                                    help="CLI kullanmak için boş bırakın."
                                />
                            </div>
                            <div>
                                <Field.Text
                                    name="mpvArgs"
                                    label="Seçenekler"
                                    placeholder="örn. --no-config --mute=yes"
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="iina">
                        <AccordionTrigger>
                            <h4 className="flex gap-2 items-center"><IoPlayForwardCircleSharp className="mr-1 text-purple-100" /> IINA</h4>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="flex gap-4">
                                <Field.Text
                                    name="iinaSocket"
                                    label="Soket"
                                    placeholder={`Varsayılan: '${getDefaultIinaSocket(serverStatus?.os ?? "")}'`}
                                />
                                <Field.Text
                                    name="iinaPath"
                                    label="CLI yolu"
                                    placeholder={"IINA CLI yolu"}
                                    help="CLI kullanmak için boş bırakın."
                                />
                            </div>
                            <div>
                                <Field.Text
                                    name="iinaArgs"
                                    label="Seçenekler"
                                    placeholder="örn. --mpv-mute=yes"
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </SettingsCard>

            <SettingsSubmitButton isPending={isPending} />

        </>
    )
}



export function ExternalPlayerLinkSettings() {

    const { externalPlayerLink, setExternalPlayerLink, encodePath, setEncodePath } = useExternalPlayerLink()

    return (
        <>
            <SettingsPageHeader
                title="Harici oynatıcı bağlantısı"
                description="Akışları bu cihazdaki harici bir oynatıcıya gönder."
                icon={LuCircleArrowOutUpRight}
            />

            <Alert
                intent="info" description={<>
                    Yalnızca bu cihaz için geçerlidir.
                </>}
            />

            <SettingsCard>
                <TextInput
                    label="Özel şema"
                    placeholder="Örnek: outplayer://{url}"
                    value={externalPlayerLink}
                    onValueChange={setExternalPlayerLink}
                />
            </SettingsCard>

            <SettingsCard>
                <Switch
                    side="right"
                    name="encodePath"
                    label="URL'deki dosya yolunu şifrele (yalnızca kütüphane)"
                    help="Etkinleştirilirse özel karakterlerle sorun yaşamamak için dosya yolu URL'de base64 formatında şifrelenir."
                    value={encodePath}
                    onValueChange={setEncodePath}
                />
            </SettingsCard>

            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 border border-gray-200 dark:border-gray-800 border-dashed">
                <RiSettings3Fill className="text-base" />
                <span>Ayarlar otomatik olarak kaydedilir</span>
            </div>
        </>
    )
}
