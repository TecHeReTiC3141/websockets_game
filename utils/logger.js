import {createLogger, transports, format} from "winston";

const combFormat = format.combine(format.timestamp(),
    format.printf(({timestamp, level, message}) => {
        return `${timestamp} - [${level.toUpperCase().padEnd(7)}] - ${message}`
    }))

export const logger = createLogger({
    format: combFormat,
    transports: [
        new transports.Console({
            level: 'info',
        }),
        new transports.File({
            filename: 'app.log',
            level: 'debug',
            options: {flags: 'w'},
        })
    ],
    level: 'debug',
});

