const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1

const socket = io();
socket.on('updatePlayers', (backEndPlayers) => {
  console.log('updating players', backEndPlayers);
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

window.addEventListener('keydown', ev => {
  if (!frontEndPlayers[socket.id]) return;

  switch (ev.code) {
    case "KeyD":
      frontEndPlayers[socket.id].x += 5
      socket.emit('keydown', 'right');
      break
    case "KeyA":
      frontEndPlayers[socket.id].x -= 5
      socket.emit('keydown', 'left');
      break
    case "KeyW":
      frontEndPlayers[socket.id].y -= 5
      socket.emit('keydown', 'up');
      break

    case "KeyS":
      frontEndPlayers[socket.id].y += 5
      socket.emit('keydown', 'down');
      break
  }
})
