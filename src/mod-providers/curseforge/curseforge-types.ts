export interface CurseForgeModProviderSettings {
    apiKey: string
}

export interface CurseForgeModIdentifier {
    projectID: string,
    fileID: string
}

export interface CurseForgeModMetadata {
    isAvailable: boolean,
    downloadUrl?: string,
    fileName: string
}