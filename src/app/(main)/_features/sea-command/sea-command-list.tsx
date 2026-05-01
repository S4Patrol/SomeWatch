import { CommandGroup, CommandItem, CommandShortcut } from "@/components/ui/command"
import { useSeaCommandContext } from "./sea-command"

// renders when "/" is typed
export function SeaCommandList() {

    const { input, setInput, select, command: { isCommand, command, args }, scrollToTop } = useSeaCommandContext()

    const commands = [
        {
            command: "anime",
            description: "Koleksiyonunuzda bulun",
            show: true,
        },
        {
            command: "library",
            description: "Anime kütüphanenizde bulun",
            show: true,
        },
        {
            command: "search",
            description: "AniList'te ara",
            show: true,
        },
        {
            command: "magnet",
            description: "Magnet linki ile izle veya indir",
            show: true,
        },
        {
            command: "logs",
            description: "Günlükleri kopyala",
            show: true,
        },
        {
            command: "issue",
            description: "Sorun bildir",
            show: true,
        },
    ]

    const filtered = commands.filter(n => n.show && n.command.startsWith(command) && n.command != command)

    if (!filtered?.length) return null

    return (
        <>
            <CommandGroup heading="Autocomplete">
                {filtered.map(command => (
                    <CommandItem
                        key={command.command}
                        onSelect={() => {
                            setInput(`/${command.command}`)
                        }}
                    >
                        <span className="tracking-widest text-sm">/{command.command}</span>
                        <CommandShortcut className="text-[--muted]">{command.description}</CommandShortcut>
                    </CommandItem>
                ))}
            </CommandGroup>
        </>
    )
}
