import { injectable } from "inversify";
import { FileDownload, ModProvider, ModpackManifest } from "../../abstractions/mod-provider.js";
import { HttpClient } from "../../http-client.js";
import { ModpacksChModManifest, ModpacksChModpackIdentifier, ModpacksChModpackManifest, ModpacksChModpackVersionManifest } from "./modpacks.ch-types.js";
import { join } from "path";

@injectable()
export class ModpacksChModProvider implements ModProvider<ModpacksChModManifest, ModpacksChModpackIdentifier> {
    private readonly httpClient = new HttpClient("https://api.modpacks.ch/public");

    public async downloadMod(mod: ModpacksChModManifest): Promise<FileDownload> {
        const dirname = mod.path.substring(1, mod.path.length-1);
        const path = join(dirname, mod.name);

        return {
            path,
            data: await HttpClient.download(mod.url)
        };
    }

    public async getManifest(modpack: ModpacksChModpackIdentifier): Promise<ModpackManifest<ModpacksChModManifest>> {
        const { name } = await this.getFullModpackManifest(modpack.id);
        const { files } = await this.getModpackVersionManifest(modpack);
        
        return {
            name,
            files: files.filter(file => file.url)
        }
    }

    public getFullModpackManifest(modpackId: number): Promise<ModpacksChModpackManifest> {
        return this.httpClient.get<ModpacksChModpackManifest>(`/modpack/${modpackId}`);
    }

    public getModpackVersionManifest(modpack: ModpacksChModpackIdentifier): Promise<ModpacksChModpackVersionManifest> {
        const url = `/modpack/${modpack.id}/${modpack.version}`;
        return this.httpClient.get<ModpackManifest<ModpacksChModManifest>>(url);
    }
}