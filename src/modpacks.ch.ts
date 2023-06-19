import { join } from "path";
import { Settings, readSettings } from "./settings.js";
import { downloadToFile } from "./utils.js"

const url = "https://api.modpacks.ch/public";

interface ModpackIdentifier {
    id: number,
    version: number
}

interface ModpackManifest {
    files: ModManifest[]
}

interface ModManifest {
    path: string,
    name: string,
    url: string
}

let settings: Settings;

async function downloadManifest(modpack: ModpackIdentifier): Promise<ModpackManifest> {
    const response = await fetch(`${url}/modpack/${modpack.id}/${modpack.version}`);
    return await response.json() as ModpackManifest;
}

function downloadMod(mod: ModManifest): Promise<void> {
    const dirname = join(settings.output_directory, mod.path.substring(1, mod.path.length-1));
    const filename = `${dirname}/${mod.name}`;

    return downloadToFile(mod.url, filename);
}

try {
    settings = await readSettings();

    console.log("Downloading manifest...");
    const manifest = await downloadManifest(settings.modpack as ModpackIdentifier);

    const files = manifest.files.filter(x => x.url);
    console.log(`Found ${files.length} items to download.`);

    await Promise.all(files.map(downloadMod));
    console.log("Done.")
} catch (err) {
    console.error(err);
}