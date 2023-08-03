import { inject, injectable } from "inversify";
import { FileDownload, ModProvider, ModpackManifest } from "../../abstractions/mod-provider.js";
import { HttpClient } from "../../http-client.js";
import { ModpacksChModManifest, ModpacksChModpackIdentifier, ModpacksChModpackManifest, ModpacksChModpackVersionManifest } from "./modpacks.ch-types.js";
import { join } from "path";
import { ABSTRACTIONS } from "../../abstractions/abstractions.js";
import { CurseForgeModIdentifier } from "../curseforge/curseforge-types.js";
import { NoDownloadException } from "../../exceptions/no-download-exception.js";

@injectable()
export class ModpacksChModProvider implements ModProvider<ModpacksChModManifest, ModpacksChModpackIdentifier> {
    private readonly httpClient = new HttpClient("https://api.modpacks.ch/public");

    public constructor(
        @inject(ABSTRACTIONS.Services.CurseForgeModProvider) private readonly curseforge: ModProvider<CurseForgeModIdentifier, string>
    ) { }

    public async downloadMod(mod: ModpacksChModManifest): Promise<FileDownload> {
        const dirname = mod.path.substring(1, mod.path.length-1);
        const path = join(dirname, mod.name);

        if (mod.url) {
            return {
                path,
                data: await HttpClient.download(mod.url)
            };
        } else if (mod.curseforge) {
            const { file, project } = mod.curseforge;
            const modId: CurseForgeModIdentifier = { fileID: "" + file, projectID: "" + project };

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
        return this.httpClient.get<ModpacksChModpackManifest>(`/modpack/${modpackId}`);
    }

    public getModpackVersionManifest(modpack: ModpacksChModpackIdentifier): Promise<ModpacksChModpackVersionManifest> {
        const url = `/modpack/${modpack.id}/${modpack.version}`;
        return this.httpClient.get<ModpackManifest<ModpacksChModManifest>>(url);
    }
}