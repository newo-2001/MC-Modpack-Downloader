import { injectable } from "inversify";
import { FileDownload, ModProvider, ModpackManifest } from "../../abstractions/mod-provider.js";
import { basename, join, relative } from "path";
import { readdirSync } from "fs";
import { LocalModIdentifer } from "./local-types.js";
import { open } from "fs/promises";

// Mod provider that sources from local filesystem
// Can be used for testing without putting unnecessary load on external API's
@injectable()
export class LocalModProvider implements ModProvider<LocalModIdentifer, string> {
    public async downloadMod(modId: LocalModIdentifer): Promise<FileDownload> {
        const location = join(modId.root, modId.path);
        const fd = await open(location);

        return {
            path: modId.path,
            download: () => Promise.resolve(fd.createReadStream())
        };
    }

    public getManifest(modpackId: string): Promise<ModpackManifest<LocalModIdentifer>> {
        const files = getFilesRecursive(modpackId)
            .map(path => ({ root: modpackId, path: relative(modpackId, path) }));
    
        return Promise.resolve({
            name: basename(modpackId),
            files
        });
    }

    public getModName(modId: LocalModIdentifer): string {
        return modId.path;
    }

    public getName(): string {
        return "local";
    }
}

function getFilesRecursive(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true })
        .flatMap(item => {
            const path = join(dir, item.name);
            return item.isDirectory() ? getFilesRecursive(path) : [ path ];
        });
}
