import mods from "../manifest.json" assert {type: 'json'};
import settings from "../settings.json" assert {type: 'json'};
import fetch from "node-fetch";
import * as fs from "fs";

const BASE_URL = "https://api.curseforge.com/v1";
const RESULT_DIRECTORY = "./mods";

const headers = {'x-api-key': settings.curseforge_api_key};

export async function download_mod(projectId, fileId) {
    const metadata = await (await fetch(`${BASE_URL}/mods/${projectId}/files/${fileId}`, {headers})).json();
    const fileName = metadata.data.fileName;
    const downloadUrl = metadata?.data?.downloadUrl;

    if (fs.existsSync(`${RESULT_DIRECTORY}/${fileName}`)) return;

    if (!downloadUrl) {
        throw new Error(`API did not provide download for file: ${fileName}, please attempt to install this file manually.`);
    }

    const res = await fetch(downloadUrl, {headers});
    const fileStream = fs.createWriteStream(`${RESULT_DIRECTORY}/${fileName}`);
    
    await new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", reject);
        res.body.on("finish", resolve);
    });
}

console.log(`Downloading ${mods.files.length} mods...`);
const tasks = [];
for (const mod of mods.files) {
    tasks.push(download_mod(mod.projectID, mod.fileID).catch(console.error));
}

await Promise.all(tasks);
console.log("Done.")