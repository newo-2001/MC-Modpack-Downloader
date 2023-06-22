import { injectable } from "inversify";
import { FileDownload, ModProvider, ModpackManifest } from "../../abstractions/mod-provider.js";
import { basename, join, relative } from "path";
import { createReadStream, readdirSync } from "fs";
import { LocalModIdentifer } from "./local-types.js";

// Mod provider that sources from local filesystem
// Can be used for testing without putting unnecessary load on external API's
@injectable()
export class LocalModProvider implements ModProvider<LocalModIdentifer, string> {
    public async downloadMod(modId: LocalModIdentifer): Promise<FileDownload> {
        const location = join(modId.root, modId.path);        

        return {
            path: modId.path,
            data: createReadStream(location)
        }
    }

    public async getManifest(modpackId: string): Promise<ModpackManifest<LocalModIdentifer>> {
        const files = (getFilesRecursive(modpackId))
            .map(path => ({ root: modpackId, path: relative(modpackId, path) }));
        
        return {
            name: basename(modpackId),
            files
        }
    }
}

function getFilesRecursive(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true })
        .flatMap(item => {
            const path = join(dir, item.name);
            return item.isDirectory() ? getFilesRecursive(path) : [ path ];
        });
}