import { FileDownload, ModProvider, ModpackManifest } from "../../abstractions/mod-provider.js";
import { HttpClient } from "../../http-client.js";
import { inject, injectable } from "inversify";
import { ABSTRACTIONS } from "../../abstractions/abstractions.js";
import { readJsonFile } from "../../utils.js";
import {
    CurseForgeModIdentifier,
    CurseForgeModMetadata,
    CurseForgeModProviderSettings,
    CurseForgeProjectMetadata, 
} from "./curseforge-types.js";
import { HttpException, InvalidApiKeyException, NoDownloadException } from "../../exceptions.js";
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
        try {
            const { downloadUrl, fileName } = await this.getModMetadata(mod);

            if (!downloadUrl) {
                const project = await this.getProjectMetadata(mod.projectID);
                throw new NoDownloadException(fileName, project.links.websiteUrl);
            }

            return {
                path: fileName,
                // This probably doesn't require the API key
                download: () => this.httpClient.download(downloadUrl)
            }
        } catch (err) {
            if (err instanceof HttpException && err.statusCode == 403) {
                throw new InvalidApiKeyException();
            }

            throw err;
        }
    }

    private async getProjectMetadata(projectId: number): Promise<CurseForgeProjectMetadata> {
        const url = `/mods/${projectId}`;

        this.logger.debug(`Downloading metadata for CurseForge project: ${projectId}`);
        return (await this.httpClient.get<{ data: CurseForgeProjectMetadata }>(url)).data;
    }

    public async getModMetadata(mod: CurseForgeModIdentifier): Promise<CurseForgeModMetadata> {
        const url = `/mods/${mod.projectID}/files/${mod.fileID}`;

        this.logger.debug(`Downloading mod metadata for file: ${mod.fileID} from CurseForge project: ${mod.projectID}`);
        return (await this.httpClient.get<{ data: CurseForgeModMetadata }>(url)).data;
    }

    public async getManifest(manifestFile: string = "manifest.json"): Promise<ModpackManifest<CurseForgeModIdentifier>> {
        this.logger.debug(`Reading manifest file: ${manifestFile}`);
        return await readJsonFile<ModpackManifest<CurseForgeModIdentifier>>(manifestFile);
    }

    public getModName(modId: CurseForgeModIdentifier): string {
        return `(fileId: ${modId.fileID}, projectId: ${modId.projectID})`;
    }
    
    public getName(): string {
        return "CurseForge";
    }
}
