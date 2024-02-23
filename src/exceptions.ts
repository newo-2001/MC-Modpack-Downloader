export class NoDownloadException extends Error {
    public readonly fileName: string;
    public readonly url?: string;

    constructor(fileName: string, url?: string) {
        super(`No download was provided for file: ${fileName}, please attempt to download this file manually.`);
        this.name = "NoDownloadException";
        this.fileName = fileName;
        this.url = url;
    }
}

export class HttpException extends Error {
    public readonly statusCode: number;
    public readonly url: string;

    constructor(url: string, code: number) {
        super(`Http call to ${url} failed with status code ${code}`);
        this.name = "HttpException";
        this.statusCode = code;
        this.url = url;
    }
}

export class InvalidApiKeyException extends Error {
    constructor() {
        super("CurseForge API key is invalid or not properly configured, please follow the steps in the README.md; if that fails open a GitHub issue.");
        this.name = "InvalidApiKeyException";
    }
}

// Exit the program but don't display a stack trace as we know the problem
export class FatalError extends Error {}
