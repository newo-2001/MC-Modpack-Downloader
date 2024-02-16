export class NoDownloadException extends Error {
    public readonly file: string;

    constructor(fileName: string) {
        super(`No download was provided for file: ${fileName}, please attempt to download this file manually.`);
        this.name = "NoDownloadException";
        this.file = fileName;
    }
}

export class HttpException extends Error {
    public readonly statusCode: number;

    constructor(code: number) {
        super(`Http call failed with status code: ${code}`);
        this.name = "HttpException";
        this.statusCode = code;
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