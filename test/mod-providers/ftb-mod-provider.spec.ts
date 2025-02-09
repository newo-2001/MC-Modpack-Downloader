import "reflect-metadata";
import { describe, test, beforeEach, expect } from "vitest";
import { Mock } from "typemoq";
import { HttpClient } from "../../src/http-client";
import { Logger } from "winston";
import { ModProvider } from "../../src/mod-providers/mod-provider";
import { CurseForgeModIdentifier } from "../../src/mod-providers/curseforge/curseforge-types";
import { Readable } from "node:stream";
import { NoDownloadException } from "../../src/exceptions";
import path from "node:path";
import { FTBModProvider } from "../../src/mod-providers/ftb/ftb-mod-provider";
import { FTBModManifest, FTBModpackManifest, FTBModpackVersionManifest } from "../../src/mod-providers/ftb/ftb-types";

const loggerMock = Mock.ofType<Logger>();
const httpClientMock = Mock.ofType<HttpClient>();
const curseForgeProviderMock = Mock.ofType<ModProvider<CurseForgeModIdentifier, string>>();
let sut: FTBModProvider;

beforeEach(() => {
    httpClientMock.reset();
    curseForgeProviderMock.reset();
    sut = new FTBModProvider(curseForgeProviderMock.object, httpClientMock.object, loggerMock.object);
});

describe("downloadMod()", () => {
    test("downloads the content from the specified url when present", async () => {
        const mod: FTBModManifest = {
            path: "./config/test-mod/",
            name: "config.json",
            url: "https://example.com/config.json"
        };

        const memoryStream = new Readable();
        memoryStream.push("test");
        memoryStream.push(null);

        httpClientMock.setup(x =>
            x.download(mod.url!)
        ).returns(() => Promise.resolve(memoryStream));

        const result = await sut.downloadMod(mod);

        expect(result.path).toBe(path.join("config", "test-mod", "config.json"));

        const stream = await result.download();
        stream.setEncoding("utf8");

        expect(stream.read()).toBe("test");
    });

    test("downloads the content from CurseForge if the curseforge field is present", async () => {
        const mod: FTBModManifest = {
            path: "./mods/",
            name: "a.jar",
            curseforge: {
                file: 1,
                project: 2
            }
        };

        const memoryStream = new Readable();
        memoryStream.push("test");
        memoryStream.push(null);

        curseForgeProviderMock.setup(x =>
            x.downloadMod({
                fileID: mod.curseforge!.file,
                projectID: mod.curseforge!.project
            })
        ).returns(() => Promise.resolve({
            path: "a.jar",
            download: () => Promise.resolve(memoryStream)
        }));
        
        const result = await sut.downloadMod(mod);
        expect(result.path).toBe(path.join("mods", "a.jar"));

        const stream = await result.download();
        stream.setEncoding("utf8");

        expect(stream.read()).toBe("test");
    });

    test("throws NoDownloadException if url and curseforge are not present", () => {
        const mod: FTBModManifest = {
            path: "./mods/",
            name: "a.jar"
        };

        expect(sut.downloadMod(mod))
            .rejects.toThrowError(new NoDownloadException(path.join("mods", "a.jar")));
    });
});

describe("getManifest()", () => {
    const mod: FTBModManifest = {
        path: "./mods/",
        name: "a.jar",
        url: "https://example.com/a.jar"
    };
    
    function setupValidModpack() {
        httpClientMock.setup(x =>
            x.get<FTBModpackManifest>("/modpack/1")
        ).returns(() => Promise.resolve({
            status: "success",
            name: "Test pack"
        }));
    }

    function setupValidVersion() {
        httpClientMock.setup(x =>
            x.get<FTBModpackVersionManifest>("/modpack/1/1")
        ).returns(() => Promise.resolve({
            status: "success",
            files: [ mod ]
        }));
    }

    test("called with a valid id obtains the modpack manifest from the FTB API", async () => {
        setupValidModpack();
        setupValidVersion();

        const result = await sut.getManifest({ id: 1, version: 1 });

        expect(result).toEqual({
            name: "Test pack",
            files: [ mod ]
        });
    });

    test("called with an invalid modpack id throws an error", async () => {
        setupValidVersion();
        
        httpClientMock.setup(
            x => x.get("/modpack/1")
        ).returns(() => Promise.resolve({
            status: "error",
            message: "Invalid modpack id"
        }));

        expect(sut.getManifest({ id: 1, version: 1 }))
            .rejects.toThrowError("Invalid modpack id");
    });

    test("called with an invalid version id throws an error", async () => {
        setupValidModpack();

        httpClientMock.setup(x =>
            x.get("/modpack/1/1")
        ).returns(() => Promise.resolve({
            status: "error",
            message: "Invalid version id"
        }));

        expect(sut.getManifest({ id: 1, version: 1 }))
            .rejects.toThrowError("Invalid version id");
    });
});

test("getName() return 'FTB'", () => {
    expect(sut.getName()).toBe("FTB");
});