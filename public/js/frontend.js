const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1

const socket = io();
socket.on('updatePlayers', (backEndPlayers) => {
  for (let id in backEndPlayers) {
    const { x, y, radius, color } = backEndPlayers[id];
    if (!frontEndPlayers[id]) {
      frontEndPlayers[id] = new Player({ x, y, radius, color });
    } else {
      frontEndPlayers[id].x = x;
      frontEndPlayers[id].y = y;
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

let animationId
function animate() {
  animationId = requestAnimationFrame(animate)
  c.fillStyle = 'rgba(0, 0, 0, 0.1)'
  c.fillRect(0, 0, canvas.width, canvas.height)
  for (let playerId in frontEndPlayers) {
    let player = frontEndPlayers[playerId];
    player.draw()
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

setInterval(() => {
  if (keys.d.pressed) {
    frontEndPlayers[socket.id].x += 5
    socket.emit('keydown', 'right');
  }
  if (keys.a.pressed) {
    frontEndPlayers[socket.id].x -= 5
    socket.emit('keydown', 'left');
  }
  if (keys.w.pressed) {
    frontEndPlayers[socket.id].y -= 5
    socket.emit('keydown', 'up');
  }
  if (keys.s.pressed) {
    frontEndPlayers[socket.id].y += 5
    socket.emit('keydown', 'down');
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
