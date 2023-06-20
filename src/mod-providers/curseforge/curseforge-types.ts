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

export class NoCurseForgeDownloadException extends Error {
    constructor(fileName: string) {
        super(`CurseForge API did not provide download for file: ${fileName}, please attempt to download this file manually.`);
        this.name = "NoCurseForgeDownloadException";
    }
}