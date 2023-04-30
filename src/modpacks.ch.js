import settings from "../settings.json" assert {type: 'json'};
import fetch from "node-fetch";
import * as download from "download";
import * as fs from "fs";

const url = "https://api.modpacks.ch/public";
const RESULT_DIRECTORY = "../mods";

function getManifest(packId, versionId) {
    return fetch(`${url}/modpack/${packId}/${versionId}`);
}

async function download_mod(mod) {
    const dirname = `${RESULT_DIRECTORY}${mod.path.substring(1, mod.path.length-1)}`;
    const filename = `${dirname}/${mod.name}`;

    fs.mkdirSync(dirname, {recursive: true});
    if (fs.existsSync(filename)) return;

    try {
        await download(mod.url, filename);
        console.log(`Downloaded: ${mod.name}`);
    } catch (e) {
        console.error(e);
    }
}

console.log("Downloading manifest...");

const manifest = await (await getManifest(settings.pack_id, settings.pack_version)).json();
console.log(`Found ${manifest.files.length} items to download.`)

for (const mod of manifest.files) {
    await download_mod(mod).catch(console.error);
}