import { Sequelize, DataTypes } from 'sequelize';
import initiateConnection from '../utils/getDBInstance.js';

// TODO: add virtual field color

const connection = initiateConnection();
const Player = connection.define('Player', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    x: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },

    y: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    radius: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10
    },
    health: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100
    },

    color: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100,
        get() {
            return `hsl(${this.getDataValue('color')}, 100%, 50%)`;
        }
    },

    sequenceNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },

    score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    avatarUrl: {
        type: DataTypes.STRING,
        allowNull: false,
    }
})

export default Player