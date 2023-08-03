export interface ModpacksChModpackIdentifier {
    id: number,
    version: number
}

export interface ModpacksChModpackManifest {
    name: string
}

export interface ModpacksChModManifest {
    path: string,
    name: string,
    url: string,
    curseforge?: ModpacksChCurseForgeFile
}

export interface ModpacksChCurseForgeFile {
    project: number,
    file: number
}

export interface ModpacksChModProviderSettings {
    modpack: ModpacksChModpackIdentifier
}

export interface ModpacksChModpackVersionManifest {
    files: ModpacksChModManifest[]
}