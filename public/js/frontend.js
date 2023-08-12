const MAIN_CANVAS_WIDTH = 2048, MAIN_CANVAS_HEIGHT = 1152;
const DISPLAY_CANVAS_WIDTH = 1024, DISPLAY_CANVAS_HEIGHT = 576;

const mainCanvas = document.querySelector('#mainCanvas')
const mainCtx = mainCanvas.getContext('2d')

console.log(mainCanvas.width, mainCanvas.height);
const displayCanvas = document.querySelector('#displayCanvas')
const displayCtx = displayCanvas.getContext('2d')

const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1

const socket = io();

const playerInputs = [];
let sequenceNumber = 0;

socket.on('updatePlayers', (backEndPlayers) => {
    for (let id in backEndPlayers) {
        const {x, y, radius, color, health, score, username, avatarUrl } = backEndPlayers[id];
        if (!frontEndPlayers[id]) {
            frontEndPlayers[id] = new Player(
                {x, y, radius, color, username, avatarUrl});
        } else {
            frontEndPlayers[id].radius = Player.MAX_RADIUS * health / 100;
            frontEndPlayers[id].score = score;
            frontEndPlayers[id].target = {
                x, y
            }
            if (id === socket.id) {
                const lastServerInputIndex = playerInputs.findIndex(input => {
                    return backEndPlayers[id].sequenceNumber === input.sequenceNumber;
                })
                if (lastServerInputIndex !== -1) {
                    playerInputs.splice(0, lastServerInputIndex + 1);
                }
                for (let input of playerInputs) {
                    frontEndPlayers[id].target.x += input.dx;
                    frontEndPlayers[id].target.y += input.dy;
                }
            }
        }
    }

    for (let id in frontEndPlayers) {
        if (!backEndPlayers[id]) {
            if (id === socket.id) {
                document.querySelector('.username-container').style.display = 'block';
            }
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

socket.on('updateParticles', backEndParticle => {
    for (let id in backEndParticle) {
        frontEndParticles[id] = new Particle({
            ...backEndParticle[id],
            velocity: {x: 0, y: 0},
        })
    }
})

displayCanvas.width = window.innerWidth * devicePixelRatio
displayCanvas.height = window.innerHeight * devicePixelRatio

mainCanvas.width = MAIN_CANVAS_WIDTH * devicePixelRatio
mainCanvas.height = MAIN_CANVAS_HEIGHT * devicePixelRatio

displayCtx.scale(devicePixelRatio, devicePixelRatio);

window.addEventListener('resize', () => {
    displayCanvas.width = window.innerWidth * devicePixelRatio
    displayCanvas.height = window.innerHeight * devicePixelRatio
})

const x = mainCanvas.width / 2
const y = mainCanvas.height / 2

const frontEndPlayers = {}
let frontEndProjectiles = {};
let frontEndParticles = {};
let sx, sy;

let animationId

function animate() {
    animationId = requestAnimationFrame(animate)
    // c.fillStyle = 'rgba(0, 0, 0, 0.1)'
    mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height)
    for (let playerId in frontEndPlayers) {
        let player = frontEndPlayers[playerId]

        if (player.target) {
            player.x += (player.target.x - player.x) * .5
            player.y += (player.target.y - player.y) * .5
        }
        player.draw();

    }
    // // also could loop projectiles from the back to pop them in the same loop
    for (let projectileId in frontEndProjectiles) {
        let projectile = frontEndProjectiles[projectileId];
        projectile.draw()
    }

    for (let particleId in frontEndParticles) {
        frontEndParticles[particleId].update()
    }

    mainCtx.strokeStyle = 'red';
    mainCtx.lineWidth = 10;
    mainCtx.strokeRect(0, 0, mainCanvas.width, mainCanvas.height);

    const currentPlayer = frontEndPlayers[socket.id];

    if (!currentPlayer) {
        sx = 0
        sy = 0
    } else {
        sx = Math.max(0,
            Math.min(mainCanvas.width - displayCanvas.width,
                currentPlayer.x - displayCanvas.width / 2))
        sy = Math.max(0,
            Math.min(mainCanvas.height - displayCanvas.height,
                currentPlayer.y - displayCanvas.height / 2));
    }


    displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height)
    displayCtx.drawImage(
        mainCanvas,
        sx,
        sy,
        displayCanvas.width,
        displayCanvas.height,
        0,
        0,
        displayCanvas.width,
        displayCanvas.height,
    )
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



setInterval(() => {
    const currentPlayer = frontEndPlayers[socket.id]
    if (keys.d.pressed && currentPlayer.x < mainCanvas.width - currentPlayer.radius * 2) {
        playerInputs.push({sequenceNumber: ++sequenceNumber, dx: Player.SPEED, dy: 0})
        currentPlayer.x = Math.min(mainCanvas.width - currentPlayer.radius * 2,
            currentPlayer.x + Player.SPEED)
        socket.emit('keydown', {direction: 'right', sequenceNumber});
    }
    if (keys.a.pressed && currentPlayer.x > currentPlayer.radius * 2) {
        playerInputs.push({sequenceNumber: ++sequenceNumber, dx: -Player.SPEED, dy: 0})
        currentPlayer.x = Math.max(currentPlayer.radius * 2,
            currentPlayer.x - Player.SPEED)
        socket.emit('keydown', {direction: 'left', sequenceNumber});
    }
    if (keys.w.pressed && currentPlayer.y > currentPlayer.radius * 2) {
        playerInputs.push({sequenceNumber: ++sequenceNumber, dx: 0, dy: -Player.SPEED})
        socket.emit('keydown', {direction: 'up', sequenceNumber});
        currentPlayer.y = Math.max(currentPlayer.radius * 2,
            currentPlayer.y - Player.SPEED)
    }
    if (keys.s.pressed && currentPlayer.y < mainCanvas.height - currentPlayer.radius * 2) {
        playerInputs.push({sequenceNumber: ++sequenceNumber, dx: 0, dy: Player.SPEED})
        currentPlayer.y = Math.min(mainCanvas.height - currentPlayer.radius * 2,
            currentPlayer.y + Player.SPEED)
        socket.emit('keydown', {direction: 'down', sequenceNumber});
    }
}, 15);

// updating leaderboard
setInterval(() => {
    $('.players').empty();
    const leaderboardData = [];
    for (let id in frontEndPlayers) {
        leaderboardData.push({
            name: frontEndPlayers[id].username,
            score: frontEndPlayers[id].score,
            avatarUrl: frontEndPlayers[id].avatarUrl.toString(),
        })
    }

    leaderboardData.sort((a, b) => {
        return b.score - a.score;
    }).forEach((player, ind) => {
        const newItem =
            $(`<li><p>${ind + 1}. <img src=${player.avatarUrl}
" alt="avatar" class="avatar"> ${player.name} - ${player.score}</p></li>`);
        $('.players').append(newItem);
    });
}, 60);

window.addEventListener('keydown', ev => {
    if (!frontEndPlayers[socket.id] || !(ev.key in keys)) return;
    keys[ev.key].pressed = true;
})

window.addEventListener('keyup', ev => {
    if (!frontEndPlayers[socket.id] || !(ev.key in keys)) return;
    keys[ev.key].pressed = false;
})
