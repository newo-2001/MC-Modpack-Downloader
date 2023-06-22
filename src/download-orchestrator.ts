import { inject, injectable } from "inversify";
import { ABSTRACTIONS } from "./abstractions/abstractions.js";
import { ModProvider, ModpackManifest } from "./abstractions/mod-provider.js";
import { NoCurseForgeDownloadException } from "./mod-providers/curseforge/curseforge-types.js";
import { dirname, join } from "path";
import { finished } from "stream/promises";
import { ConcurrentTask, ConcurrentTaskProgress } from "./concurrent-task.js";
import { Presets, SingleBar } from "cli-progress";
import { WriteStream, createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { DownloadSettings } from "./settings.js";

@injectable()
export class DownloadOrchestrator<TPackId, TModId> {
    constructor(
        @inject(ABSTRACTIONS.Services.ModProvider) private readonly provider: ModProvider<TModId, TPackId>,
        @inject(ABSTRACTIONS.Settings.Downloads) private readonly downloadSettings: DownloadSettings
    ) { }

    public async downloadAllFromModpackId(modpack: TPackId): Promise<void> {
        const manifest = await this.provider.getManifest(modpack);

        console.log(`Downloading files for ${manifest.name}`);
        return this.downloadAllFromManifest(manifest);
    }

    public async downloadAllFromManifest(manifest: ModpackManifest<TModId>): Promise<void> {
        const fileAmount = manifest.files.length;
        console.log(`Downloading ${fileAmount} files...`);

        const downloadTasks = manifest.files.map(mod => () => this.downloadMod(mod));
        const task = new ConcurrentTask(downloadTasks, { concurrency: this.downloadSettings.concurrency});

        const progressBar = new SingleBar({}, Presets.shades_classic);
        progressBar.start(downloadTasks.length, 0);

        task.on(ConcurrentTask.ProgressEvent, (progress: ConcurrentTaskProgress) => {
            progressBar.update(progress.finished);
        });

        const results = await task.run();
        const succeeded = results.filter(download => download.status == "fulfilled");
        const failed = results.filter(download => download.status == "rejected")
            .map(res => (res as PromiseRejectedResult).reason);

        progressBar.stop();

        console.log(`Successfully downloaded ${succeeded.length}/${fileAmount} files.`);

        failed.forEach(err => {
            if (err instanceof NoCurseForgeDownloadException) {
                console.warn(err.message);
            }
        });
    }

    private async downloadMod(mod: TModId): Promise<void> {
        try {
            const { path, data } = await this.provider.downloadMod(mod);
            const destination = join(this.downloadSettings.outputDirectory, path);

            const fileStream = await openWritableFileStream(destination);
            await finished(data.pipe(fileStream));
        } catch (err) {
            if (!(err instanceof NoCurseForgeDownloadException)) {
                console.error(`\n${err}`);
            }

            throw err;
        }
    }
}

async function openWritableFileStream(location: string): Promise<WriteStream> {
    await mkdir(dirname(location), { recursive: true });
    return createWriteStream(location);
}