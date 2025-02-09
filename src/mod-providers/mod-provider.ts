import { Readable } from "stream"

export type ModProviderName = "curseforge" | "modpacks.ch" | "ftb" | "local";

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
    getManifest(modpackId: TPackId): Promise<ModpackManifest<TModId>>,
    getModName(modId: TModId): string,
    getName(): string
}
