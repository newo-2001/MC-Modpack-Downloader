import { inject, injectable } from "inversify";
import { HttpClient } from "../../http-client.js";
import { CurseForgeModIdentifier } from "../curseforge/curseforge-types.js";
import { FatalError, NoDownloadException } from "../../exceptions.js";
import { Logger } from "winston";
import * as path from "path";
import { FileDownload, ModProvider, ModpackManifest } from "../mod-provider.js";
import { ABSTRACTIONS } from "../../abstractions.js";
import { FTBModManifest, FTBModpackIdentifier, FTBModpackManifest, FTBModpackVersionManifest } from "./ftb-types.js";

type FTBSuccessResponse<T extends {}> = T & {
    status: "success"
}

interface FTBErrorResponse {
    status: "error",
    message: string
}

type FTBResponse<T> = FTBSuccessResponse<T> | FTBErrorResponse

@injectable()
export class FTBModProvider implements ModProvider<FTBModManifest, FTBModpackIdentifier> {
    public constructor(
        @inject(ABSTRACTIONS.Services.CurseForgeModProvider) private readonly curseforge: ModProvider<CurseForgeModIdentifier, string>,
        @inject(ABSTRACTIONS.HttpClients.FTB) private readonly httpClient: HttpClient,
        @inject(Logger) private readonly logger: Logger
    ) {}

    public async downloadMod(mod: FTBModManifest): Promise<FileDownload> {
        const start = mod.path.startsWith("./") ? 2 : 0;
        const end = mod.path.endsWith("/") ? mod.path.length - 1 : mod.path.length;
        const dirname = mod.path.substring(start, end);
        const downloadPath = path.join(dirname, mod.name);

        if (mod.url) {
            return {
                path: downloadPath,
                download: () => this.httpClient.download(mod.url)
            }
        } else if (mod.curseforge) {
            const { file, project } = mod.curseforge;
            const modId: CurseForgeModIdentifier = { fileID: file, projectID: project };

            this.logger.debug(`Delegating download for file: ${downloadPath} to CurseForge`);

            return {
                path: downloadPath,
                download: (await this.curseforge.downloadMod(modId)).download
            }
        }

        throw new NoDownloadException(downloadPath);
    }

    public async getManifest(modpack: FTBModpackIdentifier): Promise<ModpackManifest<FTBModManifest>> {
        const { name } = await this.getFullModpackManifest(modpack.id);
        const { files } = await this.getModpackVersionManifest(modpack);

        return { name, files };
    }

    private getFullModpackManifest(modpackId: number): Promise<FTBModpackManifest> {
        this.logger.debug(`Downloading modpack manifest for modpack with id: ${modpackId}`);
        return this.httpGet<FTBModpackManifest>(`/modpack/${modpackId}`);
    }

    private getModpackVersionManifest(modpack: FTBModpackIdentifier): Promise<FTBModpackVersionManifest> {
        const url = `/modpack/${modpack.id}/${modpack.version}`;
        this.logger.debug(`Downloading modpack version manifest for modpack with id: ${modpack.id}, version: ${modpack.version}`);
        return this.httpGet<FTBModpackVersionManifest>(url);
    }

    public getModName(modId: FTBModManifest): string {
        return path.join(modId.path, modId.name);
    }

    public getName(): string {
        return "FTB";
    }

    // Having to deal with 200 OK, status: error (-_-;)
    private async httpGet<T>(endpoint: string): Promise<T> {
        const response = await this.httpClient.get<FTBResponse<T>>(endpoint);

        if (response.status == "error") {
            throw new FatalError(response.message);
        } else {
            return response;
        }
    }
}
