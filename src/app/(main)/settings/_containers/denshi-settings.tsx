import { SettingsCard } from "@/app/(main)/settings/_components/settings-card"
import { Switch } from "@/components/ui/switch"
import React from "react"
import { RiSettings3Fill } from "react-icons/ri"

export function DenshiSettings() {

    const [settings, setSettings] = React.useState<DenshiSettings | null>(null)
    const settingsRef = React.useRef<DenshiSettings | null>(null)
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        if (window.electron?.denshiSettings) {
            window.electron.denshiSettings.get().then((s) => {
                setSettings(s)
                settingsRef.current = s
                setLoading(false)
            })
        }
    }, [])

    function updateSetting(key: keyof DenshiSettings, value: boolean | string) {
        if (!settingsRef.current || !window.electron?.denshiSettings) return

        const newSettings = { ...settingsRef.current, [key]: value }
        settingsRef.current = newSettings
        setSettings(newSettings)
        window.electron.denshiSettings.set(newSettings)
    }

    if (loading || !settings) {
        return null
    }

    return (
        <div className="space-y-4">
            <SettingsCard title="Pencere">
                <Switch
                    side="right"
                    value={settings.minimizeToTray}
                    onValueChange={(v) => updateSetting("minimizeToTray", v)}
                    label="Uygulamayı kapatırken görev çubuğuna gizle"
                    help="Etkinleştirildiğinde, pencereyi kapatmak uygulamayı sistem tepsisine gizler."
                />
                <Switch
                    side="right"
                    value={settings.openInBackground}
                    onValueChange={(v) => updateSetting("openInBackground", v)}
                    label="Arka planda aç"
                    help="Açıldığında, uygulama gizli başlar. Sistem tepsisinden açabilirsiniz."
                />
            </SettingsCard>

            <SettingsCard title="Sistem">
                <Switch
                    side="right"
                    value={settings.openAtLaunch}
                    onValueChange={(v) => updateSetting("openAtLaunch", v)}
                    label="Başlangıçta aç"
                    help={window.electron?.platform === "linux"
                        ? "Bu özellik Linux'ta desteklenmiyor."
                        : "Etkinleştirildiğinde, bilgisayarınıza giriş yaptığınızda uygulama otomatik olarak başlar."}
                    disabled={window.electron?.platform === "linux"}
                />
            </SettingsCard>

            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 border border-gray-200 dark:border-gray-800 border-dashed">
                <RiSettings3Fill className="text-base" />
                <span>Ayarlar otomatik kaydedilir ve bir yeniden başlatmadan sonra uygulanır</span>
            </div>
        </div>
    )
}
