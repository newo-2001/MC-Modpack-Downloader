import "reflect-metadata";
import { expect, test, describe, vi } from "vitest";
import { Mock } from "typemoq";
import { CurseForgeModIdentifier, CurseForgeModMetadata, CurseForgeModProviderConfiguration, CurseForgeProjectMetadata } from "../../src/mod-providers/curseforge/curseforge-types";
import { CurseForgeModProvider } from "../../src/mod-providers/curseforge/curseforge-mod-provider";
import { Logger} from "winston";
import { HttpClient } from "../../src/http-client";
import { HttpException, InvalidApiKeyException, NoDownloadException } from "../../src/exceptions";
import { Readable } from "stream";
import { beforeEach } from "node:test";
import { vol } from "memfs";

vi.mock("node:fs", () => require("memfs").fs);
vi.mock("node:fs/promises", () => require("memfs").promises);

beforeEach(() => vol.reset());

const loggerMock = Mock.ofType<Logger>();
const httpClientMock = Mock.ofType<HttpClient>();
const emptyConfig = {} as CurseForgeModProviderConfiguration;

describe("downloadMod()", () => {
    test("returns the correct file download", async () => {
        const payload = "test";
        const modId: CurseForgeModIdentifier = { projectID: 1, fileID: 1 };
        const mod: CurseForgeModMetadata = {
            downloadUrl: "https://example.com/file.jar",
            fileName: "file.jar"
        };

        const mockHttpClient = Mock.ofType(HttpClient);

        mockHttpClient.setup(x => x.get<{ data: CurseForgeModMetadata }>(`/mods/${modId.projectID}/files/${modId.fileID}`))
            .returns(() => Promise.resolve({ data: mod }));

        const memoryStream = new Readable();
        memoryStream.push(payload);
        memoryStream.push(null);

        mockHttpClient.setup(x => x.download(mod.downloadUrl!))
            .returns(() => Promise.resolve(memoryStream));

        const sut = new CurseForgeModProvider(emptyConfig, () => mockHttpClient.object, loggerMock.object);
        
        const fileDownload = await sut.downloadMod(modId);
        expect(fileDownload.path).toBe(mod.fileName);
        
        const stream = await fileDownload.download();
        stream.setEncoding("utf8");

        expect(stream.read()).toBe(payload);
    })

    test("throws NoDownloadException when downloadUrl is missing", async () => {
        const modId: CurseForgeModIdentifier = { projectID: 1, fileID: 1 };
        const project = {
            links: { websiteUrl: "https://example.com" }
        } as CurseForgeProjectMetadata;

        const mod = {
            downloadUrl: undefined,
            fileName: "file.jar"
        } as CurseForgeModMetadata;

        httpClientMock.setup(x => x.get<{ data: CurseForgeModMetadata }>(`/mods/${modId.projectID}/files/${modId.fileID}`))
            .returns(() => Promise.resolve({ data: mod }));
        
        httpClientMock.setup(x => x.get<{ data: CurseForgeProjectMetadata }>(`/mods/${modId.projectID}`))
            .returns(() => Promise.resolve({ data: project }));

        const sut = new CurseForgeModProvider(emptyConfig, () => httpClientMock.object, loggerMock.object);
        
        expect(sut.downloadMod(modId))
            .rejects.toThrowError(new NoDownloadException(mod.fileName, `${project.links.websiteUrl}/files/${modId.fileID}}`));
    });

    test("throws InvalidApiKeyException when API returns 403 forbidden", async () => {
        const modId: CurseForgeModIdentifier = { projectID: 1, fileID: 1 };

        httpClientMock.setup(x => x.get(`/mods/${modId.projectID}/files/${modId.fileID}`))
            .returns(() => Promise.reject(new HttpException("", 403)))

        const sut = new CurseForgeModProvider(emptyConfig, () => httpClientMock.object, loggerMock.object);

        expect(sut.downloadMod(modId))
            .rejects.toThrowError(new InvalidApiKeyException());
    });
});

test("getManifest() reads the specified json file", async () => {
    const manifest = { files: [ "a.jar", "b.jar" ] };
    const config = {
        manifestFile: "test.json"
    } as CurseForgeModProviderConfiguration;

    vol.fromJSON({ [config.manifestFile]: JSON.stringify(manifest) }, process.cwd());

    const sut = new CurseForgeModProvider(config, () => httpClientMock.object, loggerMock.object);
    const result = await sut.getManifest(config.manifestFile);

    expect(result).toMatchObject(manifest);
});

test("name() returns 'CurseForge'", () => {
    const sut = new CurseForgeModProvider(emptyConfig, () => httpClientMock.object, loggerMock.object);
    expect(sut.getName()).toStrictEqual("CurseForge");
});