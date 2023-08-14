import {Sequelize} from 'sequelize';
import 'dotenv/config';
import {logger} from "./logger.js";

let sequelize;
export default function initializeConnection() {
    if (!sequelize) {
        sequelize = new Sequelize(process.env.DATABASE, process.env.USER,
            process.env.PASSWORD, {
                host: process.env.HOST,
                dialect: 'mysql',
                logging: msg => logger.debug(msg),
            },
        );
    }
    return sequelize;
}
