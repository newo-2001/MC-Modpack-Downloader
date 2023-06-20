import { FileDownload, ModProvider, ModpackManifest } from "../../abstractions/mod-provider.js";
import { HttpClient } from "../../http-client.js";
import { inject, injectable } from "inversify";
import { ABSTRACTIONS } from "../../abstractions/abstractions.js";
import { readJsonFile } from "../../utils.js";
import {
    CurseForgeModIdentifier,
    CurseForgeModMetadata,
    CurseForgeModProviderSettings, 
    NoCurseForgeDownloadException
} from "./curseforge-types.js";

@injectable()
export class CurseForgeModProvider implements ModProvider<CurseForgeModIdentifier, string> {
    private readonly httpClient: HttpClient;
    
    constructor(
        @inject(ABSTRACTIONS.Settings.CurseForge) private settings: CurseForgeModProviderSettings
    ) {
        const headers = { "x-api-key": this.settings.apiKey };
        this.httpClient = new HttpClient("https://api.curseforge.com/v1", headers);
    }

    public async downloadMod(mod: CurseForgeModIdentifier): Promise<FileDownload> {
        const { downloadUrl, isAvailable, fileName } = await this.getModMetadata(mod);

        // For some reason some downloadUrl's are null even though the api says they are available
        if (!isAvailable || !downloadUrl) {
            throw new NoCurseForgeDownloadException(fileName);
        }
        
        return {
            path: fileName,
            data: await HttpClient.download(downloadUrl)
        }
    }

    public async getModMetadata(mod: CurseForgeModIdentifier): Promise<CurseForgeModMetadata> {
        const url = `/mods/${mod.projectID}/files/${mod.fileID}`;
        return (await this.httpClient.get<{ data: CurseForgeModMetadata }>(url)).data;
    }

    public async getManifest(manifestFile: string = "manifest.json"): Promise<ModpackManifest<CurseForgeModIdentifier>> {
        return await readJsonFile<ModpackManifest<CurseForgeModIdentifier>>(manifestFile);
    }
}