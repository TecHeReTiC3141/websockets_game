// TODO: fix problem when players are dying

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

    socket.on('startGame', ({ username }) => {
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

        backEndPlayers[socket.id] = {
            x: Math.round(Math.random() * CANVAS_WIDTH),
            y: Math.round(Math.random() * CANVAS_HEIGHT),
            radius: 10,
            health: 100,
            color: `hsl(${hue}, 100%, 50%)`,
            sequenceNumber: 0,
            score: 0,
            name: username,
            avatarUrl: avatarUrl.toString(),
        }
    })

    socket.on('keydown', ({ direction, sequenceNumber }) => {
        const currentPlayer = backEndPlayers[socket.id];
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
    })

    socket.on('newMessage', ({ message }) => {
        io.emit('addMessage', { message, playerId: socket.id })
    })

    socket.on('disconnect', () => {
        delete backEndPlayers[socket.id];
    })
})


function updateBackend() {
    for (let id in backEndProjectiles) {
        const curProj = backEndProjectiles[id];

        curProj.x += curProj.velocity.x;
        curProj.y += curProj.velocity.y;

        if (curProj.x - PROJECTILE_RADIUS >=
            CANVAS_WIDTH
            || curProj.y - PROJECTILE_RADIUS >=
            CANVAS_HEIGHT
            || curProj.x + PROJECTILE_RADIUS <= 0
            || curProj.y + PROJECTILE_RADIUS <= 0
            || !(curProj.playerId in backEndPlayers)) {
            delete backEndProjectiles[id];
            continue;
        }

        for (let playerId in backEndPlayers) {

            if (playerId === curProj.playerId) continue;
            const backEndPlayer = backEndPlayers[playerId];
            const di = Math.hypot(backEndPlayer.x - curProj.x,
                backEndPlayer.y - curProj.y);
            if (di <= backEndPlayer.radius + PROJECTILE_RADIUS) {
                delete backEndProjectiles[id];
                backEndPlayer.health -= 25;

                backEndPlayers[curProj.playerId].score += 25;

                let partCount = 3 + Math.round(Math.random() * 5)

                while (partCount--) {
                    const px = backEndPlayer.x + Math.random() * (2 * backEndPlayer.radius) - backEndPlayer.radius,
                        py = backEndPlayer.y + Math.random() * (2 * backEndPlayer.radius) - backEndPlayer.radius,
                        psx = -3 + Math.round(Math.random() * 6),
                        psy = -3 + Math.round(Math.random() * 6)

                    backEndParticles[nanoid()] = ({
                        x: px,
                        y: py,
                        radius: Math.random() * 2 + backEndPlayer.radius / 2 - 1,
                        color: backEndPlayer.color,
                        alpha: 1,
                        velocity: {x: psx, y: psy},
                    });
                }
                if (backEndPlayer.health === 0) {
                    delete backEndPlayers[playerId];
                }
                break;
            }
        }
    }

    for (let playerId in backEndPlayers) {
        const addParticle = Math.floor(Math.random() * 5)
        if (!addParticle) {
            const curPlayer = backEndPlayers[playerId];
            const px = curPlayer.x + Math.random() * (2 * curPlayer.radius) - curPlayer.radius,
                py = curPlayer.y + Math.random() * (2 * curPlayer.radius) - curPlayer.radius
            backEndParticles[nanoid()] = ({
                x: px,
                y: py,
                radius: Math.random() * 2 + curPlayer.radius / 2 - 1,
                color: curPlayer.color,
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
}

setInterval(() => {
    try {
        updateBackend();
        io.emit('updatePlayers', backEndPlayers);
        io.emit('updateProjectiles', backEndProjectiles);
        io.emit('updateParticles', backEndParticles);
    } catch (err) {
        logger.error(err.message)
    }

}, 15);


server.listen(process.env.PORT || 3000, () => {
    logger.info(`Listening on http://localhost:${process.env.PORT || 3000}`)
})
