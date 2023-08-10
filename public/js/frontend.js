const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1

const socket = io();


socket.on('connect', () => {
    socket.emit('initCanvas', {
        width: canvas.width,
        height: canvas.height,
        devicePixelRatio
    });
})

socket.on('updatePlayers', (backEndPlayers) => {
    for (let id in backEndPlayers) {
        const {x, y, radius, color} = backEndPlayers[id];
        if (!frontEndPlayers[id]) {
            frontEndPlayers[id] = new Player({x, y, radius, color});
        } else {

            if (id === socket.id) {
                frontEndPlayers[id].x = x;
                frontEndPlayers[id].y = y;
                const lastServerInputIndex = playerInputs.findIndex(input => {
                    return backEndPlayers[id].sequenceNumber === input.sequenceNumber;
                })
                if (lastServerInputIndex !== -1) {
                    playerInputs.splice(0, lastServerInputIndex + 1);
                }
                for (let input of playerInputs) {
                    frontEndPlayers[id].x += input.dx;
                    frontEndPlayers[id].y += input.dy;
                }
            } else {
                gsap.to(frontEndPlayers[id], {
                    x, y,
                    duration: 0.015,
                    ease: 'linear',
                })
            }
        }
    }

    for (let id in frontEndPlayers) {
        if (!backEndPlayers[id]) {
            delete frontEndPlayers[id];
        }
    }
})

socket.on('updateProjectiles', (backEndProjectiles) => {
    for (let id in backEndProjectiles) {
        const {x, y, velocity, playerId} = backEndProjectiles[id];
        if (!frontEndProjectiles[id]) {
            frontEndProjectiles[id] = new Projectile({
                x,
                y,
                radius: 5,
                color: frontEndPlayers[playerId]?.color || 'white',
                velocity
            })
        } else {
            frontEndProjectiles[id].x = x;
            frontEndProjectiles[id].y = y;
        }
    }

    for (let id in frontEndProjectiles) {
        if (!backEndProjectiles[id]) {
            delete frontEndProjectiles[id];
        }
    }
})

canvas.width = innerWidth * devicePixelRatio
canvas.height = innerHeight * devicePixelRatio

window.addEventListener('resize', () => {
    canvas.width = innerWidth
    canvas.height = innerHeight
})

const x = canvas.width / 2
const y = canvas.height / 2

const frontEndPlayers = {}
let frontEndProjectiles = {};

let animationId

function animate() {
    animationId = requestAnimationFrame(animate)
    c.fillStyle = 'rgba(0, 0, 0, 0.1)'
    c.fillRect(0, 0, canvas.width, canvas.height)
    for (let playerId in frontEndPlayers) {
        let player = frontEndPlayers[playerId];
        player.draw()
    }
    // // also could loop projectiles from the back to pop them in the same loop
    for (let projectileId in frontEndProjectiles) {
        let projectile = frontEndProjectiles[projectileId];
        projectile.draw()
    }
}

animate()
const keys = {
    w: {
        pressed: false,
    },
    s: {
        pressed: false,
    },
    a: {
        pressed: false,
    },
    d: {
        pressed: false,
    },
}

const playerInputs = [];
let sequenceNumber = 0;

setInterval(() => {
    if (keys.d.pressed) {
        playerInputs.push({sequenceNumber: ++sequenceNumber, dx: Player.SPEED, dy: 0})
        frontEndPlayers[socket.id].x += Player.SPEED;
        socket.emit('keydown', {direction: 'right', sequenceNumber});
    }
    if (keys.a.pressed) {
        playerInputs.push({sequenceNumber: ++sequenceNumber, dx: -Player.SPEED, dy: 0})
        frontEndPlayers[socket.id].x -= Player.SPEED
        socket.emit('keydown', {direction: 'left', sequenceNumber});
    }
    if (keys.w.pressed) {
        playerInputs.push({sequenceNumber: ++sequenceNumber, dx: 0, dy: -Player.SPEED})
        frontEndPlayers[socket.id].y -= Player.SPEED
        socket.emit('keydown', {direction: 'up', sequenceNumber});
    }
    if (keys.s.pressed) {
        playerInputs.push({sequenceNumber: ++sequenceNumber, dx: 0, dy: Player.SPEED})
        frontEndPlayers[socket.id].y += Player.SPEED
        socket.emit('keydown', {direction: 'down', sequenceNumber});
    }
}, 15);

window.addEventListener('keydown', ev => {
    if (!frontEndPlayers[socket.id] || !(ev.key in keys)) return;
    keys[ev.key].pressed = true;
})

window.addEventListener('keyup', ev => {
    if (!frontEndPlayers[socket.id] || !(ev.key in keys)) return;
    keys[ev.key].pressed = false;
})
