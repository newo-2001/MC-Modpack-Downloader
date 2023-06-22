import { PathLike } from "fs";

export interface LocalModProviderSettings {
    source: PathLike
}

export interface LocalModIdentifer {
    root: string,
    path: string
}