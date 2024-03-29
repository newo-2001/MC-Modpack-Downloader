import { Readable } from "stream"

export interface FileDownload {
    path: string,
    download: () => Promise<Readable>
}

export interface ModpackManifest<TModId> {
    files: TModId[],
    name: string
}

export interface ModProvider<TModId, TPackId> {
    downloadMod(modId: TModId): Promise<FileDownload>,
    getManifest(modpackId: TPackId): Promise<ModpackManifest<TModId>>
    getModName(modId: TModId): string
}
