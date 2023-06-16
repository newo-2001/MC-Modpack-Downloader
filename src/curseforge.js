import { downloadToFile } from "./download.js";
import { loadSettings } from "./settings.js";
import { readFile } from "fs/promises";

const BASE_URL = "https://api.curseforge.com/v1";
const RESULT_DIRECTORY = "./mods";

let settings;

class NoCurseForgeDownloadException extends Error {
    constructor(mod) {
        super(`CurseForge API did not provide download for file: ${mod}, please attempt to download this file manually.`);
        this.name = "NoCurseForgeDownloadException";
    }
}

export async function download_mod(projectId, fileId) {
    const headers = { "x-api-key": settings.curseforge_api_key };

    const metadata = await (await fetch(`${BASE_URL}/mods/${projectId}/files/${fileId}`, { headers })).json();
    const fileName = metadata.data.fileName;
    const downloadUrl = metadata?.data?.downloadUrl;
    const destination = `${RESULT_DIRECTORY}/${fileName}`;

    if (!downloadUrl) {
        throw new NoCurseForgeDownloadException(fileName);
    }

    await downloadToFile(downloadUrl, destination, { headers });
}

async function loadManifest() {
    try {
        return JSON.parse(await readFile("manifest.json"));
    } catch {
        throw new Error("Failed to open manifest.json, please provide a valid manifest file.");
    }
}

try {
    settings = await loadSettings();

    const manifest = await loadManifest();
    console.log(`Downloading ${manifest.files.length} mods...`);

    const files = manifest.files.map(mod => download_mod(mod.projectID, mod.fileID));

    let errors = (await Promise.allSettled(files))
        .filter(res => res.status == "rejected")
        .map(res => res.reason);
    
    for (let err of errors) {
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