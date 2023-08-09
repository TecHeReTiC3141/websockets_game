const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1

const socket = io();
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

canvas.width = innerWidth * devicePixelRatio
canvas.height = innerHeight * devicePixelRatio

window.addEventListener('resize', () => {
    canvas.width = innerWidth
    canvas.height = innerHeight
})

const x = canvas.width / 2
const y = canvas.height / 2

const frontEndPlayers = {}
let frontEndProjectiles = [];

let animationId

function animate() {
    animationId = requestAnimationFrame(animate)
    c.fillStyle = 'rgba(0, 0, 0, 0.1)'
    c.fillRect(0, 0, canvas.width, canvas.height)
    for (let playerId in frontEndPlayers) {
        let player = frontEndPlayers[playerId];
        player.draw()
    }

    frontEndProjectiles.forEach(proj => {
        proj.update();
        proj.draw();
    })
    frontEndProjectiles = frontEndProjectiles.filter(proj =>
        proj.x > 0 && proj.x < window.innerWidth && proj.y > 0 && proj.y < window.innerHeight);
    console.log(frontEndProjectiles);
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
