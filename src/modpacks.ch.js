import { loadSettings } from "./settings.js";
import { downloadToFile } from "./download.js"

const url = "https://api.modpacks.ch/public";
const RESULT_DIRECTORY = "./mods";

async function downloadManifest(packId, versionId) {
    try {
        return (await fetch(`${url}/modpack/${packId}/${versionId}`)).json();
    } catch (err) {
        throw new Error(`Failed to download manifest: ${err}`);
    }
}

function downloadMod(mod) {
    const dirname = `${RESULT_DIRECTORY}${mod.path.substring(1, mod.path.length-1)}`;
    const filename = `${dirname}/${mod.name}`;

    return downloadToFile(mod.url, filename);
}

try {
    const settings = await loadSettings();

    console.log("Downloading manifest...");
    const manifest = await downloadManifest(settings.pack_id, settings.pack_version);

    const files = manifest.files.filter(x => x.url);
    console.log(`Found ${files.length} items to download.`);

    await Promise.all(files.map(downloadMod));
    console.log("Done.")
} catch (err) {
    console.error(err);
}