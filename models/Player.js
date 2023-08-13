import { Sequelize, DataTypes } from 'sequelize';
import initiateConnection from '../utils/getDBInstance.js';

const connection = initiateConnection();
const Player = connection.define('Player', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
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

    color_hue: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100
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
    avatarURL: {
        type: DataTypes.STRING,
        allowNull: false,
    }
})

export default Player