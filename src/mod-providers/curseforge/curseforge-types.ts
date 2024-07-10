export interface CurseForgeModProviderConfiguration {
    apiKey: string,
    manifestFile: string
}

export interface CurseForgeModIdentifier {
    projectID: number,
    fileID: number
}

export interface CurseForgeModMetadata {
    downloadUrl?: string,
    fileName: string
}

export interface CurseForgeProjectMetadata {
    name: string,
    id: number,
    slug: string,
    isAvailable: boolean,
    links: {
        websiteUrl: string
    }
}
