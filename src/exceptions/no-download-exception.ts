export class NoDownloadException extends Error {
    constructor(fileName: string) {
        super(`No download was provide for file: ${fileName}, please attempt to download this file manually.`);
        this.name = "NoDownloadException";
    }
}