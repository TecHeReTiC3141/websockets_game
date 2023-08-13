import {Sequelize} from 'sequelize';
import 'dotenv/config';

let sequelize;
export default function initializeConnection() {
    console.log(process.env.DATABASE, process.env.USER,
        process.env.PASSWORD)

    if (!sequelize) {
        sequelize = new Sequelize(process.env.DATABASE, process.env.USER,
            process.env.PASSWORD, {
                host: process.env.HOST,
                dialect: 'mysql',
            }
        );
    }
    return sequelize;
}
