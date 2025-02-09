export interface FTBModpackIdentifier {
    id: number,
    version: number
}

export interface FTBModpackManifest {
    name: string
}

export interface FTBModManifest {
    path: string,
    name: string,
    url?: string,
    curseforge?: FTBCurseForgeFile
}

export interface FTBCurseForgeFile {
    project: number,
    file: number
}

export interface FTBModProviderConfiguration {
    modpack: FTBModpackIdentifier
}

export interface FTBModpackVersionManifest {
    files: FTBModManifest[]
}
