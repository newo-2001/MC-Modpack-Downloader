import * as fs from "fs";
import * as path from "path";

import { Readable } from "stream";
import { finished } from "stream/promises";

function makeWriteStream(location) {
    return new Promise((resolve, reject) => {
        fs.mkdir(path.dirname(location), { recursive: true }, (err, _) => {
            if (err) return reject(err);
            resolve(fs.createWriteStream(location));
        })
    })
}

export async function downloadToFile(url, location, options = {}) {
    if (fs.existsSync(location)) return;

    // Ensure previous connections are closed by waiting for the event loop
    // As per: https://github.com/node-fetch/node-fetch/issues/1735
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const fileStream = await makeWriteStream(location);
    const { body } = await fetch(url, options);
    await finished(Readable.fromWeb(body).pipe(fileStream));
}