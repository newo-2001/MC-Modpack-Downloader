import chalk from "chalk";
import select from "@inquirer/select";
import confirm from "@inquirer/confirm";
import input from "@inquirer/input";
import { ModProviderName } from "./mod-providers/mod-provider.js";

export function warnNonEmptyOutputDirectory(): Promise<boolean> {
    return confirm({
        message: chalk.yellow("Warning: The output directory is not empty, want to continue anyway?"),
        default: false,
        theme: {
            prefix: '⚠️',
        }
    });
}

export function inquireModProvider(): Promise<ModProviderName> {
    return select({
        message: chalk.blue("What mod provider do you want to use?"),
        choices: [
            {
                name: "CurseForge",
                value: "curseforge" as ModProviderName
            },
            {
                name: "FTB",
                value: "ftb" as ModProviderName
            }
        ]
    })
}

export async function inputNumber(message: string): Promise<number> {
    return parseInt(await input({
        message,
        validate: (input: string) => !isNaN(+input),
    }), 10);
}
