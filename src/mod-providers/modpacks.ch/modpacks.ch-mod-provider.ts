import { inject, injectable } from "inversify";
import { FileDownload, ModProvider, ModpackManifest } from "../../abstractions/mod-provider.js";
import { HttpClient } from "../../http-client.js";
import { ModpacksChModManifest, ModpacksChModpackIdentifier, ModpacksChModpackManifest, ModpacksChModpackVersionManifest } from "./modpacks.ch-types.js";
import { join } from "path";
import { ABSTRACTIONS } from "../../abstractions/abstractions.js";
import { CurseForgeModIdentifier } from "../curseforge/curseforge-types.js";
import { FatalError, NoDownloadException } from "../../exceptions.js";
import { Logger } from "winston";
import * as path from "path";

type ModpacksChSuccessResponse<T extends {}> = T & {
    status: "success"
}

interface ModpacksChErrorResponse {
    status: "error",
    message: string
}

type ModpacksChResponse<T> = ModpacksChSuccessResponse<T> | ModpacksChErrorResponse

@injectable()
export class ModpacksChModProvider implements ModProvider<ModpacksChModManifest, ModpacksChModpackIdentifier> {
    private readonly httpClient: HttpClient;

    public constructor(
        @inject(ABSTRACTIONS.Services.CurseForgeModProvider) private readonly curseforge: ModProvider<CurseForgeModIdentifier, string>,
        @inject(Logger) private readonly logger: Logger
    ) {
        this.httpClient = new HttpClient("https://api.modpacks.ch/public", {}, logger);
    }

    public async downloadMod(mod: ModpacksChModManifest): Promise<FileDownload> {
        const dirname = mod.path.substring(1, mod.path.length-1);
        const path = join(dirname, mod.name);

        if (mod.url) {
            return {
                path,
                data: await this.httpClient.download(mod.url)
            }
        } else if (mod.curseforge) {
            const { file, project } = mod.curseforge;
            const modId: CurseForgeModIdentifier = { fileID: "" + file, projectID: "" + project };

            this.logger.debug(`Delegating download for file: ${path} to CurseForge`);

            return {
                path,
                data: (await this.curseforge.downloadMod(modId)).data
            }
        }

        throw new NoDownloadException(path);
    }

    public async getManifest(modpack: ModpacksChModpackIdentifier): Promise<ModpackManifest<ModpacksChModManifest>> {
        const { name } = await this.getFullModpackManifest(modpack.id);
        const { files } = await this.getModpackVersionManifest(modpack);

        return { name, files };
    }

    public getFullModpackManifest(modpackId: number): Promise<ModpacksChModpackManifest> {
        this.logger.debug(`Downloading modpack manifest for modpack with id: ${modpackId}`);
        return this.httpClient.get<ModpacksChModpackManifest>(`/modpack/${modpackId}`);
    }

    public getModpackVersionManifest(modpack: ModpacksChModpackIdentifier): Promise<ModpacksChModpackVersionManifest> {
        const url = `/modpack/${modpack.id}/${modpack.version}`;
        this.logger.debug(`Downloading modpack version manifest for modpack with id: ${modpack.id}, version: ${modpack.version}`);
        return this.httpGet<ModpacksChModpackVersionManifest>(url);
    }

    public getModName(modId: ModpacksChModManifest): string {
        return path.join(modId.path, modId.name);
    }

    // Having to deal with 200 OK, status: error (-_-;)
    private async httpGet<T>(endpoint: string): Promise<T> {
        const response = await this.httpClient.get<ModpacksChResponse<T>>(endpoint);

        if (response.status == "error") {
            throw new FatalError(response.message);
        } else {
            return response;
        }
    }
}