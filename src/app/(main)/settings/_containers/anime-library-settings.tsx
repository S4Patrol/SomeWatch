import { SettingsCard } from "@/app/(main)/settings/_components/settings-card"
import { SettingsSubmitButton } from "@/app/(main)/settings/_components/settings-submit-button"
import { DataSettings } from "@/app/(main)/settings/_containers/data-settings"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Field } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { javascript } from "@codemirror/lang-javascript"
import { vscodeDark } from "@uiw/codemirror-theme-vscode"
import CodeMirror from "@uiw/react-codemirror"
import React from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { FcFolder } from "react-icons/fc"

type LibrarySettingsProps = {
    isPending: boolean
}

export function AnimeLibrarySettings(props: LibrarySettingsProps) {

    const {
        isPending,
        ...rest
    } = props

    const { watch } = useFormContext()

    const useLegacyMatching = useWatch({ name: "scannerUseLegacyMatching" })


    return (
        <div className="space-y-4">

            <SettingsCard>
                <Field.DirectorySelector
                    name="libraryPath"
                    label="Kütüphane dizini"
                    leftIcon={<FcFolder />}
                    help="Medya dosyalarınızın bulunduğu dizinin yolu. (Büyük/küçük harfe duyarlı)"
                    shouldExist
                />

                <Field.MultiDirectorySelector
                    name="libraryPaths"
                    label="Ek kütüphane dizinleri"
                    leftIcon={<FcFolder />}
                    help="Kütüphaneniz birden fazla konumda bulunuyorsa ek dizin yolları ekleyin."
                    shouldExist
                />
            </SettingsCard>

            <SettingsCard>

                <Field.Switch
                    side="right"
                    name="autoScan"
                    label="Kütüphaneyi otomatik yenile"
                    moreHelp={<p>
                        Toplu ekleme sırasında tüm dosyaların alınıp alınmayacağı garanti değildir.
                    </p>}
                />

                <Field.Switch
                    side="right"
                    name="refreshLibraryOnStart"
                    label="Uygulama başlangıcında kütüphaneyi yenile"
                />
            </SettingsCard>

            {/*<SettingsCard title="Advanced">*/}

            <Accordion
                type="single"
                collapsible
                className="border rounded-[--radius-md]"
                triggerClass="dark:bg-[--paper]"
                contentClass="!pt-2 dark:bg-[--paper]"
                defaultValue={(useLegacyMatching) ? "more" : undefined}
            >
                <AccordionItem value="more">
                    <AccordionTrigger className="bg-gray-900 rounded-[--radius-md]" data-settings-anime-library="advanced-accordion-trigger">
                        Gelişmiş
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                        {!useLegacyMatching && <div className="space-y-4">
                            <div>
                                <p className="font-semibold text-lg mb-2">Tarayıcı Yapılandırması</p>
                                <p className="text-sm text-[--muted] mb-4">
                                    Gelişmiş tarayıcı kurallarını JSON formatında yapılandırın. Bu, kütüphaneniz için özel eşleştirme ve hidrasyon kuralları tanımlamanıza olanak tanır.
                                </p>
                            </div>
                            <ScannerConfigEditor />
                        </div>}

                        <>
                            <Field.Switch
                                name="scannerUseLegacyMatching"
                                label="Eski eşleştirme algoritmasını kullan"
                                help="Eski eşleştirme algoritmalarını kullanmak için etkinleştirin. (Sürümler 3.4 ve altı)"
                                moreHelp="Eski eşleştirme algoritması, daha az doğru olabilecek daha basit yöntemler kullanır."
                            />
                        </>

                        {useLegacyMatching && <div className="flex flex-col md:flex-row gap-3">
                            <Field.Select
                                options={[
                                    { value: "-", label: "Levenshtein + Sorensen-Dice (Varsayılan)" },
                                    { value: "sorensen-dice", label: "Sorensen-Dice" },
                                    { value: "jaccard", label: "Jaccard" },
                                ]}
                                name="scannerMatchingAlgorithm"
                                label="Eşleştirme algoritması"
                                help="Dosyaları AniList girişleriyle eşleştirmek için kullanılan algoritmayı seçin."
                            />
                            <Field.Number
                                name="scannerMatchingThreshold"
                                label="Eşleştirme eşiği"
                                placeholder="0.5"
                                help="Bir dosyanın bir AniList girişine eşleştirilmesi için gereken minimum puan. Varsayılan 0.5."
                                formatOptions={{
                                    minimumFractionDigits: 1,
                                    maximumFractionDigits: 1,
                                }}
                                max={1.0}
                                step={0.1}
                            />
                        </div>}

                        <Separator />

                        <DataSettings />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {/*</SettingsCard>*/}

            <SettingsSubmitButton isPending={isPending} />

        </div>
    )
}

function ScannerConfigEditor() {
    const { setValue } = useFormContext()
    const scannerConfig = useWatch({ name: "scannerConfig" })

    const [value, setLocalValue] = React.useState(scannerConfig || "")

    React.useEffect(() => {
        setLocalValue(scannerConfig || "")
    }, [scannerConfig])

    const handleChange = React.useCallback((val: string) => {
        setLocalValue(val)
        setValue("scannerConfig", val, { shouldDirty: true })
    }, [setValue])

    return (
        <div className="overflow-hidden rounded-[--radius-md] border">
            <CodeMirror
                value={value}
                height="400px"
                theme={vscodeDark}
                extensions={[javascript()]}
                onChange={handleChange}
                basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    bracketMatching: true,
                    syntaxHighlighting: true,
                    highlightActiveLine: true,
                }}
                placeholder={`{
  "matching": {
    "rules": []
  },
  "hydration": {
    "rules": []
  },
  "logs": {
    "verbose": false
  }
}`}
            />
        </div>
    )
}

