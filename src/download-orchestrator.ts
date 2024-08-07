import { inject, injectable } from "inversify";
import * as path from "path";
import { finished } from "stream/promises";
import { ConcurrentTask, ConcurrentTaskProgress } from "./concurrent-task.js";
import { Presets, SingleBar } from "cli-progress";
import * as fs from "fs";
import { mkdir } from "fs/promises";
import { InvalidApiKeyException, NoDownloadException } from "./exceptions.js";
import { Logger } from "winston";
import { exit } from "process";
import terminalLink from "terminal-link";
import { ModProvider, ModpackManifest } from "./mod-providers/mod-provider.js";
import { ABSTRACTIONS } from "./abstractions.js";
import { DownloadConfiguration } from "./configuration/configuration.js";

@injectable()
export class DownloadOrchestrator<TPackId, TModId> {
    constructor(
        @inject(ABSTRACTIONS.Services.ModProvider) private readonly provider: ModProvider<TModId, TPackId>,
        @inject(ABSTRACTIONS.Configuration.Downloads) private readonly downloadConfig: DownloadConfiguration,
        @inject(Logger) private readonly logger: Logger
    ) { }

    public async downloadAllFromModpackId(modpack: TPackId): Promise<void> {
        this.logger.info(`Using ${this.provider.getName()} provider`);

        const manifest = await this.provider.getManifest(modpack);

        this.logger.info(`Downloading ${manifest.files.length} files for ${manifest.name}`);
        return this.downloadAllFromManifest(manifest);
    }

    public async downloadAllFromManifest(manifest: ModpackManifest<TModId>): Promise<void> {
        const fileAmount = manifest.files.length;

        const downloadTasks = manifest.files.map(mod => () => this.downloadMod(mod));
        const task = new ConcurrentTask(downloadTasks, { concurrency: this.downloadConfig.concurrency });

        const progressBar = new SingleBar({}, Presets.shades_classic);
        progressBar.start(downloadTasks.length, 0);

        task.on(ConcurrentTask.ProgressEvent, (progress: ConcurrentTaskProgress) => {
            progressBar.update(progress.finished);
        });

        task.on(ConcurrentTask.FailureEvent, (err) => {
            if (err instanceof NoDownloadException) return;

            // Clear current line because we are printing a progress bar
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);

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

        if (failedNoDownload.length == 1) {
            const file = failedNoDownload[0];
            this.logger.info(`The following file can't be downloaded through the API, please download it manually:\n\t${file.url ? terminalLink(file.fileName, file.url, { fallback: () => `${file.fileName} ${file.url}`}) : file.fileName}`);
        } else if (failedNoDownload.length > 0) {
            const files = failedNoDownload
                .map(x => x.url ? terminalLink(x.fileName, x.url, { fallback: () => `${x.fileName} ${x.url}`}) : x.fileName)
                .join(",\n\t");

            this.logger.info(`The following ${failedNoDownload.length} files can't be downloaded through the API, please download them manually:\n\t${files}`);
        }

        if (failedFatal.length > 0) {
            const plural = failedFatal.length != 1 ? 's' : "";
            this.logger.error(`Modpack is incomplete, ${failedFatal.length} download${plural} failed unexpectedly`);
        }
    }

    private async downloadMod(mod: TModId): Promise<void> {
        const name = this.provider.getModName(mod);

        const { path: downloadPath, download } = await this.provider.downloadMod(mod);
        const destination = path.join(this.downloadConfig.outputDirectory, downloadPath);

        // Should probably check if hash matches to avoid partial downloads persisting
        if (fs.existsSync(destination)) {
            this.logger.debug(`Skipping download, file already exists: ${downloadPath}`)
            return;
        }

        const data = await download();
        const fileStream = await openWritableFileStream(destination);
        await finished(data.pipe(fileStream));

        this.logger.debug(`Successfully downloaded mod: ${name} to ${downloadPath}`);
    }
}

async function openWritableFileStream(location: string): Promise<fs.WriteStream> {
    await mkdir(path.dirname(location), { recursive: true });
    return fs.createWriteStream(location);
}
