import settings from "../settings.json" assert {type: 'json'};
import fetch from "node-fetch";
import * as fs from "fs";

const url = "https://api.modpacks.ch/public";
const RESULT_DIRECTORY = "./mods";

function getManifest(packId, versionId) {
    return fetch(`${url}/modpack/${packId}/${versionId}`);
}

async function download(url, location) {
    const res = await fetch(url);
    const fileStream = fs.createWriteStream(location);
    
    return new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", () => {
            fileStream.close();
            reject();
        });
        res.body.on("finish", () => {
            fileStream.close();
            resolve();
        });
    });
}

async function download_mod(mod) {
    const dirname = `${RESULT_DIRECTORY}${mod.path.substring(1, mod.path.length-1)}`;
    const filename = `${dirname}/${mod.name}`;

    fs.mkdirSync(dirname, {recursive: true});
    if (fs.existsSync(filename)) return;

    await download(mod.url, filename);
}

console.log("Downloading manifest...");

const manifest = await (await getManifest(settings.pack_id, settings.pack_version)).json();

const files = manifest.files.filter(x => x.url != "");
console.log(`Found ${files.length} items to download.`);

await Promise.all(files.map(mod => download_mod(mod).catch(console.error)));