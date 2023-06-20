import { inject, injectable } from "inversify";
import { ABSTRACTIONS } from "./abstractions/abstractions.js";
import { ModProvider, ModpackManifest } from "./abstractions/mod-provider.js";
import { NoCurseForgeDownloadException } from "./mod-providers/curseforge/curseforge-types.js";
import { join } from "path";
import { openWritableFileStream } from "./utils.js";
import { finished } from "stream/promises";
import { runTasks } from "./task-queue.js";

@injectable()
export class DownloadOrchestrator<TPackId, TModId> {
    constructor(
        @inject(ABSTRACTIONS.ModProvider) private readonly provider: ModProvider<TModId, TPackId>,
        @inject(ABSTRACTIONS.Settings.OutputDirectory) private readonly outputDirectory: string
    ) { }

    public async downloadAllFromModpackId(modpack: TPackId): Promise<void> {
        const manifest = await this.provider.getManifest(modpack);
        return this.downloadAllFromManifest(manifest);
    }

    public async downloadAllFromManifest(manifest: ModpackManifest<TModId>): Promise<void> {
        const fileAmount = manifest.files.length;
        console.log(`Downloading ${fileAmount} files...`);

        const files = manifest.files.map(mod => () => this.downloadMod(mod));
        
        const succeeded = (await runTasks(files))
            .filter(download => download.status == "fulfilled")
            .length;

        console.log(`Successfully downloaded ${succeeded}/${fileAmount} files.`);
    }

    private async downloadMod(mod: TModId): Promise<void> {
        try {
            const { path, data } = await this.provider.downloadMod(mod);
            const destination = join(this.outputDirectory, path);

            const fileStream = await openWritableFileStream(destination);
            await finished(data.pipe(fileStream));
        } catch (err) {
            if (err instanceof NoCurseForgeDownloadException) {
                console.warn(err.message);
            } else {
                console.error(err);
            }
            throw err;
        }
    }
}