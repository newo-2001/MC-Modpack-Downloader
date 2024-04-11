import { Logger, format, transports } from "winston";
import winston from "winston";
import { Container } from "inversify";
import { ABSTRACTIONS } from "./abstractions.js";
import { LoggingConfiguration } from "./configuration/configuration.js";

function createLogger(config: LoggingConfiguration): Logger {
    return winston.createLogger({
        transports: [
            new transports.File({
                filename: config.logFile,
                level: config.logLevel,
                options: { flags: 'w' },
                format: format.combine(
                    format.timestamp(),
                    format.printf(({ timestamp, level, message }) => {
                        return `${timestamp} [${level}] ${message}`;
                    })
                )
            }),
            new transports.Console({
                level: "info",
                format: format.combine(
                    format.colorize({
                        all: true,
                        colors: {
                            info: "bold blue"
                        }
                    }),
                    format.printf(({ message, level }) => `[${level}] ${message}`),
                ),
            })
        ]
    })
}

export function registerLogger(container: Container) {
    const logger = createLogger(container.get(ABSTRACTIONS.Configuration.Logging));
    container.bind(Logger).toConstantValue(logger);
}
