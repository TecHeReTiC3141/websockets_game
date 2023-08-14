import 'dotenv/config'

import express from 'express'
import http from 'http'
import { Server } from 'socket.io';
import { nanoid } from 'nanoid';
import { hslToHex } from './utils/color_converter.js'
import { logger } from './utils/logger.js'

const app = express()
const server = http.createServer(app);
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000, } );

const PLAYER_SPEED = 8, PLAYER_RADIUS = 10, PROJECTILE_SPEED = 5, PROJECTILE_RADIUS = 5;
const CANVAS_WIDTH = 3072, CANVAS_HEIGHT = 1728;

import initializeConnection from "./utils/getDBInstance.js";
import Player from "./models/Player.js";

const connection = initializeConnection();

connection.authenticate()
    .then(() => logger.info('Successfully connected to db'))
    .catch(err =>  logger.error(`Error while connecting: ${err.message}`));

connection.sync({ force: true })
    .then(() => logger.info('All databases successfully updated'))
    .catch(err =>  logger.error(`Error while syncing db: ${err.message}`));

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

const backEndPlayers = {};
const backEndProjectiles = {};
const backEndParticles = {};
let projectileId = 0;

const AVATAR_API = "https://avatar.oxro.io/avatar.svg";

io.on('connection', socket => {
    logger.info('a user connected');

    socket.on('startGame', async ({ username }) => {
        const hue = Math.round(Math.random() * 360),
            avatarUrl = new URL(AVATAR_API)
        const params = {
            background: hslToHex(hue, 100, 50),
            name: username,
            rounded: 8,
        }
        for (const [key, value] of Object.entries(params)) {
            avatarUrl.searchParams.append(key, value);
        }

        await Player.create({
            id: socket.id,
            x: Math.round(Math.random() * CANVAS_WIDTH),
            y: Math.round(Math.random() * CANVAS_HEIGHT),
            radius: PLAYER_RADIUS,
            health: 100,
            color: hue,
            sequenceNumber: 0,
            score: 0,
            name: username,
            avatarUrl: avatarUrl.toString(),
        })
    })

    socket.on('keydown', async ({ direction, sequenceNumber }) => {
        const currentPlayer = await Player.findByPk(socket.id);
        if (!currentPlayer) return

        currentPlayer.sequenceNumber = sequenceNumber

        switch (direction) {
            case "left":
                currentPlayer.x = Math.max(currentPlayer.radius * 2,
                    currentPlayer.x - PLAYER_SPEED)
                break
            case "right":
                currentPlayer.x = Math.min(CANVAS_WIDTH - currentPlayer.radius * 2,
                    currentPlayer.x + PLAYER_SPEED)
                break
            case "up":
                currentPlayer.y = Math.max(currentPlayer.radius * 2,
                    currentPlayer.y - PLAYER_SPEED)
                break
            case "down":
                currentPlayer.y = Math.min(CANVAS_HEIGHT - currentPlayer.radius * 2,
                    currentPlayer.y + PLAYER_SPEED)
                break
        }
        await currentPlayer.save()
    })

    socket.on('shoot', ({ x, y, angle }) => {
        const velocity = {
            x: Math.cos(angle) * PROJECTILE_SPEED,
            y: Math.sin(angle) * PROJECTILE_SPEED,
        }
        backEndProjectiles[++projectileId] = {
            x, y, velocity,
            playerId: socket.id,
        }
        logger.info(JSON.stringify(backEndProjectiles, null, 4))
    })

    socket.on('newMessage', ({ message }) => {
        io.emit('addMessage', { message, playerId: socket.id })
    })

    socket.on('disconnect', async reason => {
        await Player.destroy({
            where: {
                id: socket.id,
            }
        })
    })
})



async function updateBackend() {
    const players = await Player.findAll()
    for (let id in backEndProjectiles) {
        const curProj = backEndProjectiles[id];
        const owner = await Player.findByPk(curProj.playerId);
        if (!owner) continue;
        curProj.x += curProj.velocity.x;
        curProj.y += curProj.velocity.y;

        if (curProj.x - PROJECTILE_RADIUS >=
            CANVAS_WIDTH
            || curProj.y - PROJECTILE_RADIUS >=
            CANVAS_HEIGHT
            || curProj.x + PROJECTILE_RADIUS <= 0
            || curProj.y + PROJECTILE_RADIUS <= 0) {
            delete backEndProjectiles[id];
            continue;
        }

        for (let player of players) {
            if (player.id === curProj.playerId) continue;
            const di = Math.hypot(player.x - curProj.x,
                player.y - curProj.y);
            if (di <= player.radius + PROJECTILE_RADIUS) {
                delete backEndProjectiles[id];
                player.health -= 25;
                await player.save()

                const projOwner = await Player.findByPk(curProj.playerId)
                projOwner.score += 25;
                await projOwner.save()

                let partCount = 3 + Math.round(Math.random() * 5)

                while (partCount--) {
                    const px = player.x + Math.random() * (2 * player.radius) - player.radius,
                        py = player.y + Math.random() * (2 * player.radius) - player.radius,
                        psx = -3 + Math.round(Math.random() * 6),
                        psy = -3 + Math.round(Math.random() * 6)

                    backEndParticles[nanoid()] = ({
                        x: px,
                        y: py,
                        radius: Math.random() * 2 + player.radius / 2 - 1,
                        color: player.color,
                        alpha: 1,
                        velocity: {x: psx, y: psy},
                    });
                }
                if (player.health === 0) {
                    await Player.destroy({
                        where: {
                            id: socket.id,
                        }
                    })
                }
                break;
            }
        }
    }

    for (let player of players) {
        const addParticle = Math.floor(Math.random() * 5)
        if (!addParticle) {
            const px = player.x + Math.random() * (2 * player.radius) - player.radius,
                py = player.y + Math.random() * (2 * player.radius) - player.radius
            backEndParticles[nanoid()] = ({
                x: px,
                y: py,
                radius: Math.random() * 2 + player.radius / 2 - 1,
                color: player.color,
                alpha: 1,
                velocity: {x: 0, y: 0},
            });
        }
    }

    for (let particleId in backEndParticles) {
        const curPart = backEndParticles[particleId]
        curPart.alpha -= .01
        if (curPart.alpha <= 0) {
            delete backEndParticles[particleId];
        }
        curPart.x += curPart.velocity.x;
        curPart.y += curPart.velocity.y;
    }
    logger.debug(players.map(player => player.toJSON()));
    return {
        players: players.map(player => player.toJSON()),
    }
}

setInterval(async () => {
    try {
        const { players } = await updateBackend()
        io.emit('updatePlayers', players);
        io.emit('updateProjectiles', backEndProjectiles);
        io.emit('updateParticles', backEndParticles);
    } catch (err) {
        logger.error(err.message)
    }

}, 15);


server.listen(process.env.PORT || 3000, () => {
    logger.info(`Listening on http://localhost:${process.env.PORT || 3000}`)
})
