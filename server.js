// TODO: add fixed map on canvas, then render only certain area around player
// TODO: add avatars to players via API


const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, { pingInterval: 2000, pingTimeout: 5000, } );
const hslToHex = require('./utils/color_converter')

const port = 3000
const PLAYER_SPEED = 10, PLAYER_RADIUS = 10, PROJECTILE_SPEED = 5, PROJECTILE_RADIUS = 5;

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

const backEndPlayers = {};
const backEndProjectiles = {};
let projectileId = 0;

const AVATAR_API = "https://avatar.oxro.io/avatar.svg";

io.on('connection', socket => {
    console.log('a user connected');


    io.emit('updatePlayers', backEndPlayers);

    socket.on('startGame', ({ username, width, height, devicePixelRatio }) => {
        const hue = Math.random() * 360
        backEndPlayers[socket.id] = {
            x: 100 + Math.round(Math.random() * 500),
            y: 100 + Math.round(Math.random() * 500),
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
        if (devicePixelRatio > 1) {
            backEndPlayers[socket.id].radius *= 2
        }
    })

    socket.on('keydown', ({ direction, sequenceNumber }) => {
        backEndPlayers[socket.id].sequenceNumber = sequenceNumber;
        switch (direction) {
            case "left":
                backEndPlayers[socket.id].x -= PLAYER_SPEED
                break
            case "right":
                backEndPlayers[socket.id].x += PLAYER_SPEED
                break
            case "up":
                backEndPlayers[socket.id].y -= PLAYER_SPEED
                break
            case "down":
                backEndPlayers[socket.id].y += PLAYER_SPEED
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
                backEndPlayers[curProj.playerId]?.canvas?.width
            || curProj.y - PROJECTILE_RADIUS >=
                backEndPlayers[curProj.playerId]?.canvas?.height
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
