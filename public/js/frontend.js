const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1

const socket = io();

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

canvas.width = 1024 * devicePixelRatio
canvas.height = 576 * devicePixelRatio

c.scale(devicePixelRatio, devicePixelRatio);

window.addEventListener('resize', () => {
    canvas.width = 1024 * devicePixelRatio
    canvas.height = 576 * devicePixelRatio
})

const x = canvas.width / 2
const y = canvas.height / 2

const frontEndPlayers = {}
let frontEndProjectiles = {};

let animationId

function animate() {
    animationId = requestAnimationFrame(animate)
    // c.fillStyle = 'rgba(0, 0, 0, 0.1)'
    c.clearRect(0, 0, canvas.width, canvas.height)
    for (let playerId in frontEndPlayers) {
        let player = frontEndPlayers[playerId]

        if (player.target) {
            player.x += (player.target.x - player.x) * .5
            player.y += (player.target.y - player.y) * .5
        }
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
    const currentPlayer = frontEndPlayers[socket.id]
    if (keys.d.pressed && currentPlayer.x < canvas.width - currentPlayer.radius * 2) {
        playerInputs.push({sequenceNumber: ++sequenceNumber, dx: Player.SPEED, dy: 0})
        currentPlayer.x = Math.min(canvas.width - currentPlayer.radius * 2,
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
    if (keys.s.pressed && currentPlayer.y < canvas.height - currentPlayer.radius * 2) {
        playerInputs.push({sequenceNumber: ++sequenceNumber, dx: 0, dy: Player.SPEED})
        currentPlayer.y = Math.min(canvas.height - currentPlayer.radius * 2,
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
