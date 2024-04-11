import { PathLike } from "fs";

export interface LocalModProviderConfiguration {
    source: PathLike
}

export interface LocalModIdentifer {
    root: string,
    path: string
}
