import { inject, injectable } from "inversify";
import { ABSTRACTIONS } from "./abstractions/abstractions.js";
import { ModProvider, ModpackManifest } from "./abstractions/mod-provider.js";
import { dirname, join } from "path";
import { finished } from "stream/promises";
import { ConcurrentTask, ConcurrentTaskProgress } from "./concurrent-task.js";
import { Presets, SingleBar } from "cli-progress";
import { WriteStream, createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { DownloadSettings } from "./settings.js";
import { InvalidApiKeyException, NoDownloadException } from "./exceptions.js";
import { Logger } from "winston";
import { exit } from "process";

@injectable()
export class DownloadOrchestrator<TPackId, TModId> {
    constructor(
        @inject(ABSTRACTIONS.Services.ModProvider) private readonly provider: ModProvider<TModId, TPackId>,
        @inject(ABSTRACTIONS.Settings.Downloads) private readonly downloadSettings: DownloadSettings,
        @inject(Logger) private readonly logger: Logger
    ) { }

    public async downloadAllFromModpackId(modpack: TPackId): Promise<void> {
        const manifest = await this.provider.getManifest(modpack);

        this.logger.info(`Downloading ${manifest.files.length} files for ${manifest.name}`);
        return this.downloadAllFromManifest(manifest);
    }

    public async downloadAllFromManifest(manifest: ModpackManifest<TModId>): Promise<void> {
        const fileAmount = manifest.files.length;

        const downloadTasks = manifest.files.map(mod => () => this.downloadMod(mod));
        const task = new ConcurrentTask(downloadTasks, { concurrency: this.downloadSettings.concurrency});

        const progressBar = new SingleBar({}, Presets.shades_classic);
        progressBar.start(downloadTasks.length, 0);

        task.on(ConcurrentTask.ProgressEvent, (progress: ConcurrentTaskProgress) => {
            progressBar.update(progress.finished);
        });

        task.on(ConcurrentTask.FailureEvent, (err) => {
            if (err instanceof NoDownloadException) return;

            // Clear current line because we are printing a progress bar
            process.stdout.clearLine(0);

            if (err instanceof Error) {
                this.logger.error(err.message);
                this.logger.debug(err.stack);
            } else {
                this.logger.error("Unexpected error occurred, no information provided.");
            }

            // This error is fatal since it would trigger numerous times
            if (err instanceof InvalidApiKeyException) {
                exit(1);
            }
        });

        const results = await task.run();
        progressBar.stop();

        const succeeded = results.filter(download => download.status == "fulfilled");
        const failed = results.filter(download => download.status == "rejected")
            .map(res => (res as PromiseRejectedResult).reason);

        const failedNoDownload: NoDownloadException[] = failed.filter(x => x instanceof NoDownloadException);
        const failedFatal = failed.filter(x => !(x instanceof NoDownloadException));

        this.logger.info(`Successfully downloaded ${succeeded.length}/${fileAmount} files`);

        if (failedNoDownload.length > 0) {
            const files = failedNoDownload.map(x => x.file).join(",\n\t")
            this.logger.info(`The following ${failedNoDownload.length} files can't be downloaded through the API, please download them manually:\n\t${files}`);
        }

        if (failedFatal.length > 0) {
            this.logger.error(`Modpack is incomplete, ${failedFatal.length} downloads failed unexpectedly`);
        }
    }

    private async downloadMod(mod: TModId): Promise<void> {
        const name = this.provider.getModName(mod);

        const { path, data } = await this.provider.downloadMod(mod);
        const destination = join(this.downloadSettings.outputDirectory, path);

        const fileStream = await openWritableFileStream(destination);
        await finished(data.pipe(fileStream));

        this.logger.debug(`Successfully downloaded mod: ${name} to ${path}`);
    }
}

async function openWritableFileStream(location: string): Promise<WriteStream> {
    await mkdir(dirname(location), { recursive: true });
    return createWriteStream(location);
}