// TODO: add fixed map on canvas, then render only certain area around player
// TODO: display players' names above them
// TODO: add particles when player is hit

const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000, } );
const hslToHex = require('./utils/color_converter')

const port = 3000
const PLAYER_SPEED = 10, PLAYER_RADIUS = 10, PROJECTILE_SPEED = 5, PROJECTILE_RADIUS = 5;
const CANVAS_WIDTH = 2048, CANVAS_HEIGHT = 1152;

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
    console.log('a user connected');


    io.emit('updatePlayers', backEndPlayers);

    socket.on('startGame', ({ username, width, height, devicePixelRatio }) => {
        const hue = Math.random() * 360
        backEndPlayers[socket.id] = {
            x: Math.round(Math.random() * CANVAS_WIDTH),
            y: Math.round(Math.random() * CANVAS_HEIGHT),
            radius: 10,
            health: 100,
            color: `hsl(${hue}, 100%, 50%)`,
            sequenceNumber: 0,
            score: 0,
            username,
            canvas: {
                width, height,
            },
            avatarUrl: new URL(AVATAR_API),
        }

        const params = {
            background: hslToHex(hue, 100, 50),
            name: username,
            rounded: 8,
        }
        for (const [key, value] of Object.entries(params)) {
            backEndPlayers[socket.id].avatarUrl.searchParams.append(key, value);
        }

        backEndPlayers[socket.id].radius = PLAYER_RADIUS;
    })

    socket.on('keydown', ({ direction, sequenceNumber }) => {
        const currentPlayer = backEndPlayers[socket.id]
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
        console.log(backEndProjectiles);
    })

    socket.on('disconnect', reason => {
        console.log(reason, socket.id);
        delete backEndPlayers[socket.id];
        io.emit('updatePlayers', backEndPlayers);
    })
    console.log(backEndPlayers);
})

setInterval(() => {
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
                if (backEndPlayer.health === 0) {
                    delete backEndPlayers[playerId];
                }
                break;
            }
        }
    }

    io.emit('updatePlayers', backEndPlayers);
    io.emit('updateProjectiles', backEndProjectiles);
}, 15);

server.listen(port, () => {
    console.log(`Example app listening on http://localhost:${port}`)
})
