export const ABSTRACTIONS = {
    Settings: {
        Providers: {
            CurseForge: Symbol("Settings.CurseForge"),
            ModpacksCh: Symbol("Settings.ModpacksCh")
        },
        Downloads: Symbol("Settings.Downloads"),
        Logging: Symbol("Settings.Logging"),
        All: Symbol("Settings.All")
    },
    Services: {
        ModProvider: Symbol("Services.ModProvider"),
        CurseForgeModProvider: Symbol("Services.CurseForgeModProvider"),
        ModpackIdResolver: Symbol("Services.ModpackIdResolver")
    }
};