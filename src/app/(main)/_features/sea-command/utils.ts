import { AL_BaseAnime_Title, AL_BaseManga_Title } from "@/api/generated/types"
import { Nullish } from "@/types/common"

export function useSeaCommand_ParseCommand(input: string) {
    const isCommand = input.startsWith("/")
    const parts = input.split(/\s+/)

    return {
        isCommand: isCommand,
        command: isCommand ? parts[0].slice(1) : "",
        args: isCommand ? parts.slice(1) : parts,
    }
}

export type SeaCommand_ParsedCommandProps = ReturnType<typeof useSeaCommand_ParseCommand>

export function seaCommand_compareMediaTitles(titles: Nullish<AL_BaseAnime_Title | AL_BaseManga_Title>, query: string) {
    if (!titles) return false
    return (!!titles.english && cleanMediaTitle(titles.english).includes(cleanMediaTitle(query)))
        || (!!titles.romaji && cleanMediaTitle(titles.romaji).includes(cleanMediaTitle(query)))
}

function cleanMediaTitle(str: string) {
    // remove all non-alphanumeric characters
    return str.replace(/[^a-zA-Z0-9 ]/g, "").toLowerCase()
}
