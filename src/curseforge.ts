import { downloadToFile, readJsonFile } from "./utils.js";
import { Settings, readSettings } from "./settings.js";
import { join } from "path";

const BASE_URL = "https://api.curseforge.com/v1";

let settings: Settings;

class NoCurseForgeDownloadException extends Error {
    constructor(fileName: string) {
        super(`CurseForge API did not provide download for file: ${fileName}, please attempt to download this file manually.`);
        this.name = "NoCurseForgeDownloadException";
    }
}

interface ModpackManifest {
    files: ModIdentifier[]
}

interface ModIdentifier {
    projectID: string,
    fileID: string
}

interface ModMetadata {
    data: {
        isAvailable: boolean,
        downloadUrl?: string,
        fileName: string
    }
}

async function downloadMod(mod: ModIdentifier): Promise<void> {
    const headers = { "x-api-key": settings.curseforge_api_key };

    const url = `${BASE_URL}/mods/${mod.projectID}/files/${mod.fileID}`;
    const response = await fetch(url, { headers });
    const metadata = await response.json() as ModMetadata;
    const { fileName, isAvailable, downloadUrl } = metadata.data;

    // For some reason some downloadUrl's are null even though the api says they are available
    if (!isAvailable || !downloadUrl) {
        throw new NoCurseForgeDownloadException(fileName);
    }
    
    const destination = join(settings.output_directory, fileName);
    await downloadToFile(downloadUrl, destination, { headers });
}

async function loadManifest(): Promise<ModpackManifest> {
    try {
        return await readJsonFile("manifest.json") as ModpackManifest;
    } catch {
        throw new Error("Failed to open manifest.json, please provide a valid manifest file.");
    }
}

try {
    settings = await readSettings();

    const manifest = await loadManifest();
    console.log(`Downloading ${manifest.files.length} mods...`);

    const files = manifest.files.map(downloadMod);
    const errors = (await Promise.allSettled(files))
        .filter(res => res.status == "rejected")
        .map(res => (res as PromiseRejectedResult).reason);
    
    for (const err of errors) {
        if (err instanceof NoCurseForgeDownloadException) {
            console.warn(err.message);
        } else {
            console.error(err);
        }
    }

    console.log("Done.")
} catch (err) {
    console.error(err);
}