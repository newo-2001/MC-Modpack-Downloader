import { FileDownload, ModProvider, ModpackManifest } from "../../abstractions/mod-provider.js";
import { HttpClient } from "../../http-client.js";
import { inject, injectable } from "inversify";
import { ABSTRACTIONS } from "../../abstractions/abstractions.js";
import { readJsonFile } from "../../utils.js";
import {
    CurseForgeModIdentifier,
    CurseForgeModMetadata,
    CurseForgeModProviderSettings, 
} from "./curseforge-types.js";
import { NoDownloadException } from "../../exceptions/no-download-exception.js";
import { Logger } from "winston";

@injectable()
export class CurseForgeModProvider implements ModProvider<CurseForgeModIdentifier, string> {
    private readonly httpClient: HttpClient;
    
    constructor(
        @inject(ABSTRACTIONS.Settings.Providers.CurseForge) private readonly settings: CurseForgeModProviderSettings,
        @inject(Logger) private readonly logger: Logger
    ) {
        const headers = { "x-api-key": this.settings.apiKey };
        this.httpClient = new HttpClient("https://api.curseforge.com/v1", headers, this.logger);
    }

    public async downloadMod(mod: CurseForgeModIdentifier): Promise<FileDownload> {
        const { downloadUrl, isAvailable, fileName } = await this.getModMetadata(mod);

        // For some reason some downloadUrl's are null even though the api says they are available
        if (!isAvailable || !downloadUrl) {
            throw new NoDownloadException(fileName);
        }
        
        return {
            path: fileName,
            data: await this.httpClient.download(downloadUrl)
        }
    }

    public async getModMetadata(mod: CurseForgeModIdentifier): Promise<CurseForgeModMetadata> {
        const url = `/mods/${mod.projectID}/files/${mod.fileID}`;

        this.logger.debug(`Downloading mod metadata for file: ${mod.fileID} from CurseForge project: ${mod.projectID}`);
        return (await this.httpClient.get<{ data: CurseForgeModMetadata }>(url)).data;
    }

    public async getManifest(manifestFile: string = "manifest.json"): Promise<ModpackManifest<CurseForgeModIdentifier>> {
        this.logger.info(`Reading manifest file: ${manifestFile}`);
        return await readJsonFile<ModpackManifest<CurseForgeModIdentifier>>(manifestFile);
    }

    public getModName(modId: CurseForgeModIdentifier): string {
        return `(fileId: ${modId.fileID}, projectId: ${modId.projectID})`;
    }
}